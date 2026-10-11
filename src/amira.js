// Princess Amira as she looks in the cartoons: the series' own render, played as
// short green-screen clips (wave, dance, cheer, magic) and keyed out live on a
// plane that always turns to face the viewer. Between clips she holds her still
// pose, so every clip starts and ends seamlessly.
import * as THREE from 'three';

const CLIPS = ['wave', 'dance', 'cheer', 'magic'];
const ALIAS = { cast: 'magic' };

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = `
uniform sampler2D map; uniform float glow; uniform float flash; varying vec2 vUv;
void main(){
  vec4 c = texture2D(map, vUv);
  float g = c.g - max(c.r, c.b);
  float a = 1.0 - smoothstep(0.05, 0.16, g);   // green screen -> transparent
  // the source render has a soft grey floor shadow under her feet: drop neutral greys there
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  if (vUv.y < 0.14 && mx - mn < 0.09 && mx > 0.35 && mx < 0.8) a = 0.0;
  if (a < 0.5) discard;
  c.g = min(c.g, max(c.r, c.b) + 0.03);        // remove green spill on the edges
  gl_FragColor = vec4(c.rgb + glow * vec3(0.18, 0.14, 0.04) + flash * vec3(0.5, 0.2, 0.3), 1.0);
  #include <colorspace_fragment>
}`;

function blobShadow(radius) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(50,25,30,0.45)');
  grd.addColorStop(1, 'rgba(50,25,30,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 32), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(1.2, 0.7, 1);
  m.position.y = 0.004;
  return m;
}

// height: Amira's height in world units (her feet sit at the group's origin)
export function cartoonAmira({ baseUrl, manager, height = 1 }) {
  const src = (p) => new URL(p, baseUrl).href;
  const videos = {};
  const videoTex = {};
  for (const n of CLIPS) {
    const v = document.createElement('video');
    v.src = src(`amira/${n}.mp4`);
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    videos[n] = v;
    videoTex[n] = new THREE.VideoTexture(v);
    videoTex[n].colorSpace = THREE.SRGBColorSpace;
  }
  const still = new THREE.TextureLoader(manager).load(src('amira/still.jpg'));
  still.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.ShaderMaterial({
    uniforms: { map: { value: still }, glow: { value: 0 }, flash: { value: 0 } },
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, toneMapped: false,
  });
  // the frame is 9:16; she fills 74% of its height, feet 6% above its bottom
  const frameH = height / 0.74;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(frameH * 9 / 16, frameH), material);
  plane.position.y = frameH / 2 - 0.06 * frameH;
  const body = new THREE.Group(); // turns to face the viewer
  body.add(plane);
  const group = new THREE.Group();
  group.add(body, blobShadow(height * 0.3));
  // taps hit this undrawn capsule, not the plane, whose empty corners shouldn't count
  plane.raycast = () => {};
  const hit = new THREE.Mesh(new THREE.CapsuleGeometry(height * 0.2, height * 0.6, 4, 8), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  hit.position.y = height * 0.5;
  group.add(hit);

  // face whichever camera is drawing her (also each eye in WebXR), upright only
  const camLocal = new THREE.Vector3();
  plane.onBeforeRender = (_r, _s, camera) => {
    camera.getWorldPosition(camLocal);
    group.worldToLocal(camLocal);
    body.rotation.y = Math.atan2(camLocal.x, camLocal.z);
  };

  let clip = null;
  function play(name) {
    name = ALIAS[name] || name;
    const v = videos[name];
    if (!v) return 0;
    if (clip && clip !== name) videos[clip].pause();
    clip = name;
    v.currentTime = 0;
    // switch to the clip only once it really has frames (no black box on slow loads)
    v.onplaying = () => { if (clip === name) material.uniforms.map.value = videoTex[name]; };
    v.onended = () => { if (clip === name) { clip = null; material.uniforms.map.value = still; } };
    v.onerror = v.onended;
    v.play().catch(() => { if (clip === name) clip = null; });
    if (name === 'magic') material.uniforms.glow.value = 1;
    return Number.isFinite(v.duration) ? v.duration : 5;
  }

  const head = new THREE.Vector3();
  return {
    group,
    hit,
    material,
    play,
    has: (n) => !!videos[ALIAS[n] || n],
    headWorld() {
      group.updateMatrixWorld(true);
      return group.localToWorld(head.set(0, height * 0.82, 0));
    },
    update(dt, t) {
      // gentle breathing while she holds her still pose
      plane.scale.y = 1 + (clip ? 0 : Math.sin(t * 2.4) * 0.008);
      const u = material.uniforms;
      u.glow.value = Math.max(0, u.glow.value - dt * 0.6);
      u.flash.value = Math.max(0, u.flash.value - dt * 2.5);
    },
  };
}
