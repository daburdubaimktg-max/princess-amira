// Amira Magic Scan: point the camera at a Dabur Amla Kids pack (or the printable
// Amira card) and Princess Amira bursts out and plays a mini-game with the child.
//   Hair Oil   -> catch the golden amla berries (they fly into her hair)
//   Detangler  -> pop the grumpy tangle knots
//   Shampoo    -> pop the magic bubbles
// Tap Amira to tickle her, start a dance party, and take a photo with her.
// Image tracking runs in the browser (MindAR), so it works on iPhone and Android.
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { character } from '../src/world.js';
import { Sparkles, heartTexture, play, sound, unlockAudio } from '../src/effects.js';
import { STRINGS } from '../src/i18n.js';

// ---------- copy ----------
const UI = {
  ar: {
    eyebrow: 'سحر دابر آملا كيدز',
    title: 'امسحي… والعبي مع الأميرة أميرة!',
    subtitle: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو إلى بطاقة أميرة، وستخرج الأميرة لتلعب معك ✨',
    start: '📷 افتحي الكاميرا',
    loading: 'جاري تحميل أميرة…',
    camera: 'جاري تشغيل الكاميرا…',
    cameraError: 'لم نتمكن من فتح الكاميرا. اسمحي بالوصول إلى الكاميرا ثم حاولي مجدداً.',
    scanHint: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة',
    lang: 'English',
    hello: 'مرحباً! أنا الأميرة أميرة 👑 ساعديني!',
    missions: {
      berries: 'المسي حبّات الآملا الذهبية لتجعلي شعري قوياً! ✨',
      knots: 'فرقعي عُقد التشابك حول أميرة! 💥',
      bubbles: 'فرقعي فقاعات السحر! 🫧',
    },
    cheers: ['رائع! ✨', 'أحسنتِ! 💖', 'واحدة أخرى! ⭐', 'يا سلام! 🌟', 'أنتِ بطلة! 🏆'],
    tickle: ['هههه! هذا يدغدغ! 😆', 'وييييي! 🌟', 'أنتِ صديقتي المفضلة! 💖', 'هيا نرقص معاً! 💃'],
    winTitle: 'شعر قوي ولامع! 🎉',
    cardWin: 'لا تشابك بعد اليوم! هذا هو سحر آملا كيدز ✨',
    dance: '💃 رقصة',
    photo: '📸 صورة مع أميرة',
    again: '🔄 مرة أخرى',
    share: 'حفظ / مشاركة الصورة',
    back: 'رجوع',
    afterWin: 'المسيني لأضحك، أو التقطي صورة معي! 📸',
    danceLine: 'هيا نرقص! 🎶',
  },
  en: {
    eyebrow: 'Dabur Amla Kids magic',
    title: 'Scan it… and play with Princess Amira!',
    subtitle: 'Point your camera at an Amla Kids pack or the Amira card, and Princess Amira jumps out to play ✨',
    start: '📷 Open camera',
    loading: 'Loading Amira…',
    camera: 'Starting camera…',
    cameraError: "We couldn't open the camera. Allow camera access, then try again.",
    scanHint: 'Point your camera at an Amla Kids pack or the Amira card',
    lang: 'العربية',
    hello: "Hi! I'm Princess Amira 👑 Help me!",
    missions: {
      berries: 'Tap the golden amla berries to make my hair strong! ✨',
      knots: 'Pop the tangle knots around Amira! 💥',
      bubbles: 'Pop the magic bubbles! 🫧',
    },
    cheers: ['Yay! ✨', 'Great job! 💖', 'One more! ⭐', 'Wow! 🌟', "You're a star! 🏆"],
    tickle: ['Hehe! That tickles! 😆', 'Wheeee! 🌟', "You're my best friend! 💖", "Let's dance together! 💃"],
    winTitle: 'Strong, shiny hair! 🎉',
    cardWin: "No more tangles! That's Dabur Amla Kids magic ✨",
    dance: '💃 Dance',
    photo: '📸 Photo with Amira',
    again: '🔄 Play again',
    share: 'Save / share photo',
    back: 'Back',
    afterWin: 'Tap me to make me giggle, or take a photo with me! 📸',
    danceLine: "Let's dance! 🎶",
  },
};
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const T = () => UI[lang];
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T()[el.dataset.i18n]; });
  if (game.theme) $('mission').textContent = T().missions[game.theme];
}

let bubbleTimer = 0;
function say(text, ms = 3500) {
  const b = $('bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}

// ---------- targets (order matches targets.mind) ----------
// height = target image height / width (MindAR makes the target 1 unit wide)
const TARGETS = [
  { id: 'oil', height: 1024 / 495, color: 0xe0a33a, product: 0, theme: 'berries', icon: '🟢' },
  { id: 'detangler', height: 1024 / 441, color: 0xe8408f, product: 1, theme: 'knots', icon: '💥' },
  { id: 'shampoo', height: 1024 / 479, color: 0x8a4fd8, product: 2, theme: 'bubbles', icon: '🫧' },
  { id: 'card', height: 1680 / 1200, color: 0xf0628f, product: null, theme: 'knots', icon: '💥' },
];
const GOAL = 8;
const game = { target: -1, theme: null, phase: 'idle', score: 0, spawned: 0 };
applyLang();

// ---------- preload Amira ----------
const status = $('status');
const modelUrl = (f) => new URL(`../assets/models/${f}`, import.meta.url).href;
const loader = new GLTFLoader();
let loaded = 0;
const track = (p) => p.then((g) => { loaded++; status.textContent = loaded < 4 ? `${T().loading} ${Math.round((loaded / 4) * 100)}%` : ''; return g; });
status.textContent = T().loading;
const amiraReady = Promise.all([
  track(loader.loadAsync(modelUrl('amira.glb'))),
  track(loader.loadAsync(modelUrl('amira_wave.glb')).catch(() => null)),
  track(loader.loadAsync(modelUrl('amira_cheer.glb')).catch(() => null)),
  track(loader.loadAsync(modelUrl('amira_cast.glb')).catch(() => null)),
]).then(([g, wave, cheer, cast]) => character(g, { wave: wave?.animations, cheer: cheer?.animations, cast: cast?.animations }, 1, { armsOnly: true, idleWeight: 0.6 }));

// ---------- AR ----------
const container = $('ar');
const mindar = new MindARThree({
  container,
  imageTargetSrc: new URL('./targets/targets.mind', import.meta.url).href,
  maxTrack: 1,
  uiLoading: 'no',
  uiScanning: 'no',
  uiError: 'no',
  filterMinCF: 0.0001, // steadier pose, a touch more lag
  filterBeta: 0.001,
});
const { renderer, scene, camera } = mindar;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xfff6ee, 0x806070, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(0.5, 1, 1);
scene.add(key);

function canvasTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = canvasTex(128, (g, s) => {
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
});

// stage (re-parented to whichever target is seen) > actor (procedural body motion) > Amira
const stage = new THREE.Group();
const actor = new THREE.Group();
stage.add(actor);
const blob = new THREE.Mesh(
  new THREE.CircleGeometry(0.32, 40),
  new THREE.MeshBasicMaterial({
    map: canvasTex(128, (g, s) => {
      const grd = g.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
      grd.addColorStop(0, 'rgba(40,20,30,0.55)');
      grd.addColorStop(1, 'rgba(40,20,30,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, s, s);
    }),
    transparent: true,
    depthWrite: false,
  }),
);
blob.rotation.x = -Math.PI / 2;
blob.position.y = 0.002;
stage.add(blob);
const items = new THREE.Group(); // game pieces live in Amira's space (she is 1 unit tall)
stage.add(items);

// over a camera feed the canvas is transparent: add light without writing alpha,
// otherwise fading particles show up as dark specks
const GLOW_BLEND = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
};
const sparkles = new Sparkles(900);
const hearts = new Sparkles(200, heartTexture());
Object.assign(sparkles.points.material, GLOW_BLEND);
Object.assign(hearts.points.material, GLOW_BLEND);
stage.add(sparkles.points, hearts.points);
let amira = null;

const anchors = TARGETS.map((t, i) => {
  const a = mindar.addAnchor(i);
  a.onTargetFound = () => onFound(i, a);
  a.onTargetLost = () => onLost(i);
  return a;
});

// ---------- tweens + procedural body moves ----------
const tweens = [];
const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });
const ease = (k) => 1 - Math.pow(1 - k, 3);
let move = null; // {type, t, dur}
function doMove(type, dur) { move = { type, t: 0, dur }; }

function updateActor(dt, time) {
  // idle: breathing bob and a gentle sway, so she never stands frozen
  actor.position.set(0, Math.abs(Math.sin(time * 1.6)) * 0.012, 0);
  actor.rotation.set(0, Math.sin(time * 0.7) * 0.12, Math.sin(time * 1.1) * 0.025);
  actor.scale.set(1, 1, 1);
  if (!move) return;
  move.t += dt;
  const k = Math.min(1, move.t / move.dur);
  if (move.type === 'hop') {
    const h = Math.sin(k * Math.PI);
    actor.position.y += h * 0.28;
    const squash = k < 0.12 ? 1 - Math.sin((k / 0.12) * Math.PI) * 0.12 : 1;
    actor.scale.set(2 - squash, squash, 2 - squash);
  } else if (move.type === 'twirl') {
    actor.position.y += Math.sin(k * Math.PI) * 0.15;
    actor.rotation.y += ease(k) * Math.PI * 2;
  } else if (move.type === 'dance') {
    const beat = move.t / 0.38; // matches the dance tune's tempo
    actor.position.y += Math.abs(Math.sin(beat * Math.PI)) * 0.1;
    actor.position.x = Math.sin(beat * Math.PI * 0.5) * 0.12;
    actor.rotation.z = Math.sin(beat * Math.PI * 0.5) * 0.12;
    const spin = Math.floor(beat) % 4 === 3 ? ease(beat % 1) * Math.PI * 2 : 0;
    actor.rotation.y = spin + Math.sin(beat * Math.PI * 0.25) * 0.4;
    if (Math.random() < 0.25) hearts.emit(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.8, 0.2), pick([0xff6fa5, 0xff9ec4, 0xf0628f]), { speed: 0.15, up: 0.25, life: 1.4 });
  }
  if (k >= 1) move = null;
}

// ---------- game pieces ----------
function makeItem(theme) {
  const g = new THREE.Group();
  let body;
  if (theme === 'berries') {
    // amla berry: glossy pale-green with faint vertical segments and a tiny stem
    body = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.075, 32, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const a = Math.atan2(v.z, v.x);
      v.multiplyScalar(1 + Math.cos(a * 6) * 0.03 * (1 - Math.abs(v.y) / 0.075));
      p.setXYZ(i, v.x, v.y * 0.92, v.z);
    }
    geo.computeVertexNormals();
    body.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xb7d96a, roughness: 0.25, clearcoat: 1, sheen: 0.4, sheenColor: 0xfff3a0 })));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.035, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2a }));
    stem.position.y = 0.075;
    body.add(stem);
  } else if (theme === 'knots') {
    // a grumpy purple tangle ball with angry eyes
    body = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(0.08, 3);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + (Math.sin(v.x * 90) * Math.cos(v.y * 80) * Math.sin(v.z * 70)) * 0.18);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    body.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6b2fa8, roughness: 0.85, emissive: 0x2a0b45 })));
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(s * 0.028, 0.012, 0.07);
      eye.scale.set(1, 0.75, 0.6);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshBasicMaterial({ color: 0x1a0626 }));
      pupil.position.set(s * 0.028, 0.008, 0.083);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.007, 0.006), new THREE.MeshBasicMaterial({ color: 0x1a0626 }));
      brow.position.set(s * 0.028, 0.036, 0.078);
      brow.rotation.z = s * -0.5;
      body.add(eye, pupil, brow);
    }
  } else {
    // iridescent soap bubble with a bright highlight
    body = new THREE.Group();
    body.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 24), new THREE.MeshPhysicalMaterial({
      color: 0xe8f7ff, transparent: true, opacity: 0.55, roughness: 0, metalness: 0.2, emissive: 0x3a6a90, emissiveIntensity: 0.35,
      iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 900], depthWrite: false,
    })));
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    hl.position.set(-0.035, 0.04, 0.06);
    body.add(hl);
  }
  g.add(body);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, depthWrite: false, ...GLOW_BLEND,
    color: theme === 'berries' ? 0xffd54f : theme === 'knots' ? 0xb06cff : 0x9fe8ff,
    opacity: theme === 'bubbles' ? 0.7 : 0.8,
  }));
  glow.scale.setScalar(0.3);
  g.add(glow);
  // generous invisible hit sphere so small fingers always connect
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.item = g;
  g.add(hit);
  g.userData = { body, alive: true, a: Math.random() * Math.PI * 2, r: 0.5 + Math.random() * 0.25, h: 0.25 + Math.random() * 0.75, speed: (0.35 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1), phase: Math.random() * 6, born: 0 };
  return g;
}

function spawn() {
  if (game.phase !== 'play' || game.spawned >= GOAL) return;
  const it = makeItem(game.theme);
  it.scale.setScalar(0.01);
  items.add(it);
  game.spawned++;
  play('tap');
}

function startGame(i) {
  for (const c of [...items.children]) items.remove(c);
  game.target = i;
  game.theme = TARGETS[i].theme;
  game.score = 0;
  game.spawned = 0;
  game.phase = 'play';
  $('score').hidden = false;
  $('score-icon').textContent = TARGETS[i].icon;
  $('score-dots').innerHTML = '<i></i>'.repeat(GOAL);
  $('mission').hidden = false;
  $('mission').textContent = T().missions[game.theme];
  $('btn-again').hidden = true;
  for (let k = 0; k < 3; k++) setTimeout(spawn, 300 + k * 450);
}

function collect(it) {
  if (!it.userData.alive || game.phase !== 'play') return;
  it.userData.alive = false;
  const p = it.position.clone();
  if (game.theme === 'berries') {
    // the berry flies into her hair and makes it shine
    play('berry');
    const head = new THREE.Vector3(0, 0.82, -0.04);
    tween(0.55, (k) => {
      it.position.lerpVectors(p, head, ease(k));
      it.scale.setScalar(1 - k * 0.8);
    }, () => {
      items.remove(it);
      sparkles.burst(head, [0xffd54f, 0xfff3a0, 0xffffff], 50, { speed: 0.5, up: 0.1, life: 1.2 });
      for (let n = 0; n < 30; n++) sparkles.emit(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.3 + Math.random() * 0.55, -0.08), 0xffe082, { speed: 0.08, up: -0.05, life: 1.4 });
    });
  } else {
    play('pop');
    tween(0.12, (k) => it.scale.setScalar(1 + k * 0.6), () => items.remove(it));
    sparkles.burst(p, game.theme === 'knots' ? [0xb06cff, 0xff8fc8, 0xffffff] : [0x9fe8ff, 0xffffff, 0xffb3e6], 45, { speed: 0.8, up: 0.15, life: 1 });
    if (game.theme === 'knots') hearts.burst(p, [0xff6fa5, 0xff9ec4], 6, { speed: 0.4, up: 0.3, life: 1.2 });
  }
  game.score++;
  document.querySelectorAll('#score-dots i').forEach((d, n) => d.classList.toggle('on', n < game.score));
  if (game.score >= GOAL) { setTimeout(win, 650); return; }
  if (game.score % 3 === 0) { amira.play(pick(['wave', 'cheer'])); doMove('hop', 0.6); say(pick(T().cheers), 1500); }
  setTimeout(spawn, 350);
  if (items.children.filter((c) => c.userData.alive).length < 2) setTimeout(spawn, 700);
}

function win() {
  game.phase = 'won';
  const t = TARGETS[game.target];
  $('mission').hidden = true;
  play('win');
  amira.play('cheer');
  doMove('twirl', 1.1);
  // confetti fountain in the brand colours
  for (let n = 0; n < 4; n++) {
    setTimeout(() => {
      sparkles.burst(new THREE.Vector3((Math.random() - 0.5) * 0.6, 1.0, 0.1), [0xffd54f, 0xe8408f, 0x8a4fd8, 0x7fe7ff, 0xffffff, t.color], 120, { speed: 1.5, up: 0.6, life: 2.2 });
      hearts.burst(new THREE.Vector3(0, 0.9, 0.15), [0xff6fa5, 0xff9ec4, 0xf0628f], 14, { speed: 0.7, up: 0.5, life: 1.8 });
    }, n * 280);
  }
  $('win-line').textContent = t.product === null ? T().cardWin : STRINGS[lang].productLines[t.product];
  $('win').hidden = false;
  setTimeout(() => {
    $('win').hidden = true;
    say(T().afterWin, 5000);
    $('btn-again').hidden = false;
  }, 3800);
}

// ---------- which pack is it? ----------
// The three packs share the same artwork, so the tracker can't reliably tell them
// apart in greyscale. Once one is found, read the label colour from the camera
// image (the skirt / lower label) and pick the closest pack colour.
const idDebug = {};
const PACK_HUES = [{ i: 0, hue: 28 }, { i: 1, hue: 335 }, { i: 2, hue: 275 }];
const probe = document.createElement('canvas');
probe.width = 160;
probe.height = 120;
function identifyPack(anchor, fallback) {
  const video = mindar.video;
  idDebug.video = !!video && video.videoWidth;
  if (!video || !video.videoWidth) return fallback;
  const g = probe.getContext('2d', { willReadFrequently: true });
  g.drawImage(video, 0, 0, probe.width, probe.height);
  const cr = container.getBoundingClientRect();
  const vr = video.getBoundingClientRect();
  const h = TARGETS[fallback].height;
  anchor.group.updateWorldMatrix(true, false); // the found callback fires before the next render
  camera.updateMatrixWorld();
  idDebug.pts = [];
  // circular mean of hue, weighted by saturation, over the pack-coloured areas
  // (crown cap, dress, sparkly base); grey/white/skin pixels barely count
  let hx = 0, hy = 0, w = 0;
  const hsl = {};
  const col = new THREE.Color();
  for (const [x, y] of [[0, 0.44], [-0.05, -0.08], [0.08, -0.12], [-0.3, -0.43], [0.3, -0.43], [0, -0.46]]) {
    const v = new THREE.Vector3(x, y * h, 0).applyMatrix4(anchor.group.matrixWorld).project(camera);
    const sx = (v.x + 1) / 2 * cr.width + cr.left - vr.left;
    const sy = (1 - v.y) / 2 * cr.height + cr.top - vr.top;
    const px = Math.round((sx / vr.width) * probe.width);
    const py = Math.round((sy / vr.height) * probe.height);
    idDebug.pts.push([px, py]);
    if (px < 2 || py < 2 || px >= probe.width - 2 || py >= probe.height - 2) continue;
    const d = g.getImageData(px - 2, py - 2, 5, 5).data;
    for (let k = 0; k < d.length; k += 4) {
      col.setRGB(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255, THREE.SRGBColorSpace).getHSL(hsl);
      if (hsl.s < 0.3 || hsl.l < 0.12 || hsl.l > 0.88) continue;
      const wt = hsl.s;
      hx += Math.cos(hsl.h * Math.PI * 2) * wt;
      hy += Math.sin(hsl.h * Math.PI * 2) * wt;
      w += wt;
    }
  }
  idDebug.w = w;
  if (w < 1) return fallback;
  const hue = ((Math.atan2(hy, hx) / (Math.PI * 2)) * 360 + 360) % 360;
  idDebug.hue = hue;
  const dist = (a, c) => Math.min(Math.abs(a - c), 360 - Math.abs(a - c));
  return PACK_HUES.reduce((best, p) => (dist(hue, p.hue) < dist(hue, best.hue) ? p : best)).i;
}

// ---------- tracking events ----------
let lastLost = { i: -1, at: 0 };
const _v = new THREE.Vector3();

function placeFor(i, anchor) {
  const t = TARGETS[i];
  const end = new THREE.Vector3();
  const rot = new THREE.Euler();
  let size;
  if (t.id !== 'card') {
    // a bottle stands upright: she lands on the table beside it, turned slightly to it
    size = 1.15;
    end.set(0.85, -t.height / 2, 0.25);
    rot.set(0, -0.35, 0);
  } else {
    // card: on a screen (facing the camera) she stands on its bottom edge;
    // lying on a table she stands on the card itself
    anchor.group.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).transformDirection(anchor.group.matrixWorld);
    const toCam = anchor.group.getWorldPosition(new THREE.Vector3()).negate().normalize();
    size = 1.15;
    if (n.dot(toCam) > 0.82) {
      end.set(0, -t.height / 2 + 0.02, 0.2);
    } else {
      end.set(0, -0.15, 0.0);
      rot.set(Math.PI / 2, 0, 0);
    }
  }
  return { end, rot, size };
}

function onFound(found, anchor) {
  $('scan-hint').hidden = true;
  if (!amira) return;
  const i = TARGETS[found].id === 'card' ? found : identifyPack(anchor, found);
  $('actions').hidden = false;
  const t = TARGETS[i];
  const { end, rot, size } = placeFor(found, anchor); // geometry of the image actually tracked
  anchor.group.add(stage);
  stage.rotation.copy(rot);
  const quickReturn = lastLost.i === i && performance.now() - lastLost.at < 5000;
  if (quickReturn && game.target === i) {
    stage.position.copy(end);
    stage.scale.setScalar(size);
    if (game.phase === 'play') $('mission').hidden = false;
    return;
  }
  // she bursts out of the label, spins through the air and lands
  game.phase = 'intro';
  for (const c of [...items.children]) items.remove(c);
  $('score').hidden = true;
  const start = new THREE.Vector3(0, 0, 0.05);
  play('place');
  amira.play('cheer');
  tween(1.3, (k) => {
    const e = ease(k);
    stage.position.lerpVectors(start, end, e);
    if (rot.x === 0) stage.position.z += Math.sin(k * Math.PI) * 0.6;
    stage.scale.setScalar(Math.max(0.01, size * e));
    stage.rotation.y = rot.y + (1 - e) * Math.PI * 2;
    if (Math.random() < 0.8) sparkles.emit(new THREE.Vector3(0, 0.5, 0), pick([t.color, 0xffffff, 0xffd54f]), { speed: 0.6, up: 0.2, life: 1.2 });
  }, () => {
    sparkles.burst(new THREE.Vector3(0, 0.6, 0), [t.color, 0xffd54f, 0xffffff], 90, { speed: 1.2, up: 0.4, life: 1.6 });
    play('win');
    amira.play('wave');
    doMove('hop', 0.6);
    say(T().hello, 2600);
    setTimeout(() => startGame(i), 1800);
  });
}

function onLost() {
  lastLost = { i: game.target, at: performance.now() };
  $('scan-hint').hidden = false;
  $('actions').hidden = true;
  $('mission').hidden = true;
}

// ---------- tapping ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
container.addEventListener('pointerdown', (e) => {
  if (!amira || !stage.parent || !stage.parent.visible) return;
  const r = container.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hitItem = raycaster.intersectObjects(items.children, true).find((h) => h.object.userData.item?.userData.alive);
  if (hitItem) { collect(hitItem.object.userData.item); return; }
  if (raycaster.intersectObject(amira.group, true).length) tickle();
});

let tickleN = 0;
function tickle() {
  play('giggle');
  const kind = tickleN++ % 3;
  if (kind === 0) { doMove('hop', 0.6); amira.play('wave'); } else if (kind === 1) { doMove('twirl', 1.0); } else { doMove('hop', 0.6); amira.play('cheer'); }
  hearts.burst(new THREE.Vector3(0, 0.8, 0.15), [0xff6fa5, 0xff9ec4, 0xf0628f], 14, { speed: 0.5, up: 0.4, life: 1.5 });
  say(pick(T().tickle), 2200);
}

// ---------- buttons ----------
$('btn-dance').onclick = () => {
  if (!amira) return;
  play('dance');
  amira.play('cheer', { once: false });
  doMove('dance', 6.1);
  say(T().danceLine, 2500);
  setTimeout(() => amira.play('wave'), 6100);
};
$('btn-again').onclick = () => { if (game.target >= 0) startGame(game.target); };

let shotBlob = null;
$('btn-photo').onclick = () => {
  // freeze one frame: camera video (as displayed) + the 3D layer + a small brand tag
  const video = mindar.video;
  const cr = container.getBoundingClientRect();
  const W = renderer.domElement.width;
  const H = renderer.domElement.height;
  const sx = W / cr.width;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (video) {
    const vr = video.getBoundingClientRect();
    g.drawImage(video, (vr.left - cr.left) * sx, (vr.top - cr.top) * sx, vr.width * sx, vr.height * sx);
  }
  renderer.render(scene, camera);
  g.drawImage(renderer.domElement, 0, 0);
  const pad = 18 * sx;
  g.font = `800 ${22 * sx}px Fredoka, sans-serif`;
  const tag = '👑 Princess Amira · Dabur Amla Kids';
  const tw = g.measureText(tag).width;
  g.fillStyle = 'rgba(255,249,244,0.9)';
  g.beginPath();
  g.roundRect(pad, H - pad - 44 * sx, tw + 28 * sx, 40 * sx, 20 * sx);
  g.fill();
  g.fillStyle = '#c8456a';
  g.fillText(tag, pad + 14 * sx, H - pad - 16 * sx);
  play('place');
  $('flash').classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => $('flash').classList.remove('on')));
  c.toBlob((b) => {
    shotBlob = b;
    $('shot-img').src = URL.createObjectURL(b);
    $('shot').hidden = false;
  }, 'image/jpeg', 0.92);
};
$('btn-share').onclick = async () => {
  if (!shotBlob) return;
  const file = new File([shotBlob], 'amira-photo.jpg', { type: 'image/jpeg' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Princess Amira' });
      return;
    }
  } catch { /* fall back to a download */ }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(shotBlob);
  a.download = 'amira-photo.jpg';
  a.click();
};
$('btn-shot-close').onclick = () => { $('shot').hidden = true; };

$('btn-lang').onclick = () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('amira-lang', lang); } catch { /* ignore */ }
  applyLang();
};
$('btn-sound').onclick = () => {
  sound.muted = !sound.muted;
  $('btn-sound').textContent = sound.muted ? '🔇' : '🔊';
};
$('btn-close').onclick = () => {
  mindar.stop();
  renderer.setAnimationLoop(null);
  $('hud').hidden = true;
  $('intro').hidden = false;
  $('btn-start').disabled = false;
};

// ---------- start ----------
$('btn-start').onclick = async () => {
  unlockAudio();
  $('btn-start').disabled = true;
  status.textContent = T().camera;
  try {
    const [a] = await Promise.all([amiraReady, mindar.start()]);
    if (!amira) {
      amira = a;
      actor.add(amira.group);
    }
    $('intro').hidden = true;
    $('hud').hidden = false;
    $('scan-hint').hidden = false;
    status.textContent = '';
    const clock = new THREE.Clock();
    let spawnClock = 0;
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      for (let k = tweens.length - 1; k >= 0; k--) {
        const tw = tweens[k];
        tw.t += dt;
        const p = Math.min(1, tw.t / tw.dur);
        tw.fn(p);
        if (p >= 1) { tweens.splice(k, 1); tw.done?.(); }
      }
      amira.mixer.update(dt);
      updateActor(dt, time);
      // game pieces drift around her
      for (const it of items.children) {
        const u = it.userData;
        if (!u.alive) continue;
        u.born += dt;
        it.scale.setScalar(Math.min(1, u.born * 3));
        u.a += u.speed * dt;
        let h = u.h + Math.sin(time * 2 + u.phase) * 0.05;
        if (game.theme === 'bubbles') { u.h += dt * 0.08; if (u.h > 1.15) u.h = 0.2; h = u.h + Math.sin(time * 3 + u.phase) * 0.03; }
        it.position.set(Math.cos(u.a) * u.r, h, Math.sin(u.a) * u.r * 0.7 + 0.15);
        u.body.rotation.y += dt * (game.theme === 'knots' ? 2.5 : 0.6);
        if (game.theme === 'knots') u.body.rotation.z = Math.sin(time * 6 + u.phase) * 0.25;
      }
      // keep a couple of pieces on screen while playing
      spawnClock += dt;
      if (game.phase === 'play' && spawnClock > 1.5) {
        spawnClock = 0;
        if (items.children.filter((c) => c.userData.alive).length < 2) spawn();
      }
      // ambient sparkles around her
      if (stage.parent && Math.random() < 0.3) {
        sparkles.emit(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 1.1, (Math.random() - 0.5) * 0.3), pick([0xffe082, 0xfff6d6]), { speed: 0.08, up: 0.12, life: 1.2 });
      }
      // point size is in world units; MindAR scales the anchor, so follow its scale
      const s = stage.matrixWorld.getMaxScaleOnAxis();
      sparkles.points.material.size = 0.05 * s;
      hearts.points.material.size = 0.09 * s;
      sparkles.update(dt);
      hearts.update(dt);
      renderer.render(scene, camera);
    });
  } catch (err) {
    console.error(err);
    status.textContent = T().cameraError;
    $('btn-start').disabled = false;
  }
};

// handy for automated tests: open with ?debug
if (new URLSearchParams(location.search).has('debug')) {
  window.amiraScan = { idDebug, identifyPack, game, items, collect, tickle, camera, container, THREE, get amira() { return amira; } };
}
