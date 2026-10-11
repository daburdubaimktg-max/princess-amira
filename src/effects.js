// Sparkle particles + tiny synthesized sounds (no audio files needed).
import * as THREE from 'three';

function starTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(30, 4, 4, 56);
  g.fillRect(4, 30, 56, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Sparkles {
  constructor(max = 600) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.ttl = new Float32Array(max);
    this.next = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.045, map: starTexture(), vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    this.points.frustumCulled = false;
    this.base = new Float32Array(max * 3);
  }

  emit(p, color, { speed = 0.6, life = 1.2, up = 0.4, spread = 1 } = {}) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    const c = new THREE.Color(color);
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.base.set([c.r, c.g, c.b], i * 3);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const s = speed * (0.4 + Math.random() * 0.6);
    this.vel.set([
      Math.sin(ph) * Math.cos(th) * s * spread,
      Math.cos(ph) * s * spread + up,
      Math.sin(ph) * Math.sin(th) * s * spread,
    ], i * 3);
    this.life[i] = life * (0.6 + Math.random() * 0.4);
    this.ttl[i] = this.life[i];
  }

  burst(p, color, n = 60, opts) {
    const colors = Array.isArray(color) ? color : [color];
    for (let k = 0; k < n; k++) this.emit(p, colors[k % colors.length], opts);
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.ttl[i] <= 0) { this.col[i * 3] = this.col[i * 3 + 1] = this.col[i * 3 + 2] = 0; continue; }
      this.ttl[i] -= dt;
      const k = Math.max(0, this.ttl[i] / this.life[i]);
      this.vel[i * 3 + 1] -= 0.35 * dt; // gentle gravity
      for (let a = 0; a < 3; a++) {
        this.vel[i * 3 + a] *= 1 - 1.5 * dt;
        this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt;
        this.col[i * 3 + a] = this.base[i * 3 + a] * k * (0.7 + 0.3 * Math.sin(i + this.ttl[i] * 20));
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

// ---- Sound ----
let ctx = null;
export const sound = { muted: false };

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function note(freq, when, dur = 0.35, type = 'sine', vol = 0.15) {
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + when);
  g.gain.linearRampToValueAtTime(vol, a.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + when + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + when);
  o.stop(a.currentTime + when + dur + 0.05);
}

const SEQ = {
  tap: [[1318.5, 0]],
  collect: [[784, 0], [988, 0.08], [1318.5, 0.16], [1568, 0.24]],
  grow: [[523.3, 0], [659.3, 0.1], [784, 0.2], [1046.5, 0.3], [1318.5, 0.4]],
  cloud: [[196, 0, 0.5, 'triangle', 0.12], [185, 0.15, 0.5, 'triangle', 0.12]],
  win: [[784, 0], [988, 0.12], [1175, 0.24], [1568, 0.36], [1318.5, 0.5], [1568, 0.62], [2093, 0.8, 0.8]],
  place: [[659.3, 0], [1318.5, 0.06, 0.6]],
};

export function play(name) {
  if (sound.muted) return;
  try {
    for (const [f, w, d, t, v] of SEQ[name] || []) note(f, w, d, t, v);
  } catch { /* audio unavailable */ }
}

export function unlockAudio() { try { ac(); } catch { /* ignore */ } }
