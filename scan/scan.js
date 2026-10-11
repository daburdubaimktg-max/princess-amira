// Amira Magic Scan — a cinematic AR adventure.
//
// The pack is the key: scanning a Dabur Amla Kids pack (or the Amira card) awakens
// it, magic streams to the middle of the screen, a portal opens and Amira's whole
// world rises into the room in front of the child, big and centred, and stays put
// as the phone moves (gyroscope). Then the story plays out in chapters:
//   1  Golden Magic      catch the magic flying around Amira
//   2  The Tangle Storm  sky darkens, thunder, knots attack her hair (3 hearts)
//   3  The Tangle Cloud  boss fills the sky; tap it down, Amira finishes it
//   ★  Royal Celebration storm clears, rainbow, fireworks, the three packs rise
// Amira is the series' cartoon render, animated with green-screen clips that are
// keyed live, and she speaks (generated voice lines, Arabic and English).
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sparkles, heartTexture, play, sound } from '../src/effects.js';
import { STRINGS } from '../src/i18n.js';
import { loadProducts } from '../src/products.js';
import { music } from './music.js';

// ---------- copy ----------
const UI = {
  ar: {
    eyebrow: 'سحر دابر آملا كيدز',
    title: 'امسحي العبوة… وادخلي عالم أميرة!',
    subtitle: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة، وشاهدي عالمها السحري يظهر أمامك ✨',
    start: '✨ ابدئي المغامرة',
    tip: '🔊 شغّلي الصوت للحصول على أفضل تجربة',
    loading: 'جاري تحضير السحر…',
    camera: 'جاري تشغيل الكاميرا…',
    cameraError: 'لم نتمكن من فتح الكاميرا. اسمحي بالوصول إلى الكاميرا ثم حاولي مجدداً.',
    scanHint: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة',
    lang: 'English',
    presents: 'دابر آملا كيدز تقدّم',
    story: 'أميرة وعاصفة التشابك',
    chapter: (n) => `الفصل ${['١', '٢', '٣'][n - 1]}`,
    finaleTag: 'الخاتمة',
    chapters: ['السحر الذهبي', 'عاصفة التشابك', 'غيمة التشابك', 'الاحتفال الملكي'],
    missions: {
      berries: 'المسي حبّات الآملا الذهبية! ✨',
      bubbles: 'فرقعي فقاعات السحر! 🫧',
      sparkles: 'اجمعي النجوم السحرية! ⭐',
      knots: 'فرقعي العُقد قبل أن تصل لشعر أميرة! 💥',
      boss: 'المسي الغيمة بسرعة! 🌩️',
    },
    say: {
      intro: 'مرحباً! أنا الأميرة أميرة! أهلاً بكِ في جزيرتي السحرية!',
      ch1: 'ساعديني أجمع السحر الذهبي، ليصبح شعري قوياً ولامعاً!',
      ch2: 'يا إلهي! عاصفة التشابك قادمة! فرقعي العُقد قبل أن تصل لشعري!',
      ch3: 'إنها غيمة التشابك! المسيها بأسرع ما يمكن!',
      win: 'لقد نجحنا! شعري قوي ولامع! هذا هو سحر دابر آملا كيدز!',
      tickle: 'هههه، هذا يُدغدغ!',
      ouch: 'آي! عقدة في شعري!',
      photo: 'هيا نلتقط صورة معاً! ابتسمي!',
    },
    combo: 'كومبو',
    winTitle: 'أنقذتِ جزيرة أميرة! 🎉',
    cardWin: 'لا تشابك بعد اليوم! هذا هو سحر آملا كيدز ✨',
    score: 'النقاط',
    dance: '💃 رقصة',
    photo: '📸 صورة مع أميرة',
    again: '🔄 مغامرة جديدة',
    share: 'حفظ / مشاركة الصورة',
    back: 'رجوع',
  },
  en: {
    eyebrow: 'Dabur Amla Kids magic',
    title: "Scan the pack… and step into Amira's world!",
    subtitle: "Point your camera at an Amla Kids pack or the Amira card, and watch her magic world appear in front of you ✨",
    start: '✨ Start the adventure',
    tip: '🔊 Turn your sound on for the full experience',
    loading: 'Preparing the magic…',
    camera: 'Starting camera…',
    cameraError: "We couldn't open the camera. Allow camera access, then try again.",
    scanHint: 'Point your camera at an Amla Kids pack or the Amira card',
    lang: 'العربية',
    presents: 'Dabur Amla Kids presents',
    story: 'Amira and the Tangle Storm',
    chapter: (n) => `Chapter ${n}`,
    finaleTag: 'Finale',
    chapters: ['Golden Magic', 'The Tangle Storm', 'The Tangle Cloud', 'The Royal Celebration'],
    missions: {
      berries: 'Tap the golden amla berries! ✨',
      bubbles: 'Pop the magic bubbles! 🫧',
      sparkles: 'Catch the magic stars! ⭐',
      knots: "Pop the knots before they reach Amira's hair! 💥",
      boss: 'Tap the cloud as fast as you can! 🌩️',
    },
    say: {
      intro: "Hello! I'm Princess Amira! Welcome to my magic island!",
      ch1: 'Help me catch the golden magic, so my hair grows strong and shiny!',
      ch2: 'Oh no! The Tangle Storm is coming! Pop the knots before they reach my hair!',
      ch3: "It's the Tangle Cloud! Tap it as fast as you can!",
      win: "We did it! My hair is strong and shiny! That's Dabur Amla Kids magic!",
      tickle: 'Hehe, that tickles!',
      ouch: 'Ouch! A tangle in my hair!',
      photo: "Let's take a photo together! Smile!",
    },
    combo: 'COMBO',
    winTitle: "You saved Amira's island! 🎉",
    cardWin: "No more tangles! That's Dabur Amla Kids magic ✨",
    score: 'Score',
    dance: '💃 Dance',
    photo: '📸 Photo with Amira',
    again: '🔄 New adventure',
    share: 'Save / share photo',
    back: 'Back',
  },
};
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const T = () => UI[lang];
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const game = { target: -1, phase: 'idle', wave: 0, waveKey: null, need: 0, got: 0, hearts: 3, score: 0, combo: 0, lastHit: 0, bossHp: 0, spawnT: 0 };
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = T()[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
  if (game.waveKey) $('mission').textContent = T().missions[game.waveKey];
}
applyLang();
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

// ---------- Amira's voice ----------
let bubbleTimer = 0;
function caption(text, ms = 3600) {
  const b = $('bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}
const voiceUrl = (k) => new URL(`../assets/voice/${lang}_${k}.mp3`, import.meta.url).href;
let voice = null;
function speak(key, { interrupt = true } = {}) {
  caption(T().say[key], 4500);
  if (voice && !voice.paused && !interrupt) return;
  if (voice) voice.pause();
  voice = new Audio(voiceUrl(key));
  voice.muted = sound.muted;
  music.duck(true);
  voice.onended = () => music.duck(false);
  voice.play().catch(() => music.duck(false));
}

// ---------- targets (order matches targets.mind) ----------
const TARGETS = [
  { id: 'oil', height: 1024 / 495, color: 0xe0a33a, product: 0, theme: 'berries' },
  { id: 'detangler', height: 1024 / 441, color: 0xe8408f, product: 1, theme: 'bubbles' },
  { id: 'shampoo', height: 1024 / 479, color: 0x8a4fd8, product: 2, theme: 'bubbles' },
  { id: 'card', height: 1680 / 1200, color: 0xf0628f, product: null, theme: 'sparkles' },
];

// ---------- loading ----------
const status = $('status');
const base = (p) => new URL(`../${p}`, import.meta.url).href;
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { status.textContent = done < total ? `${T().loading} ${Math.round((done / total) * 100)}%` : ''; };
const gltf = new GLTFLoader(manager);
const tex = new THREE.TextureLoader(manager);
status.textContent = T().loading;

const CLIPS = ['wave', 'dance', 'cheer', 'magic'];
const videos = Object.fromEntries(CLIPS.map((n) => {
  const v = document.createElement('video');
  v.src = base(`assets/amira/${n}.mp4`);
  v.muted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'auto';
  v.crossOrigin = 'anonymous';
  return [n, v];
}));

// ---------- AR ----------
const container = $('ar');
const mindar = new MindARThree({
  container,
  imageTargetSrc: new URL('./targets/targets.mind', import.meta.url).href,
  maxTrack: 1,
  uiLoading: 'no',
  uiScanning: 'no',
  uiError: 'no',
  filterMinCF: 0.0001,
  filterBeta: 0.001,
});
const { renderer, scene, camera } = mindar;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const hemi = new THREE.HemisphereLight(0xfff6ee, 0x806070, 1.2);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(0.6, 1, 1);
scene.add(key);
// colour grade layer between the camera image and the 3D canvas
const tint = document.createElement('div');
tint.id = 'tint';

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const radial = (stops) => canvasTex(128, 128, (g, s) => {
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  stops.forEach(([k, c]) => grd.addColorStop(k, c));
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
});
const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
// over a camera feed the canvas is transparent: add light without writing alpha
const GLOW = {
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
};
const glowSprite = (color, size, opacity = 0.8) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, ...GLOW, color, opacity }));
  s.scale.setScalar(size);
  return s;
};

function fit(obj, height) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  obj.scale.multiplyScalar(height / (box.max.y - box.min.y));
  obj.updateMatrixWorld(true);
  box.setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y;
  obj.traverse((m) => { if (m.isMesh && m.material.metalness !== undefined) m.material.metalness = Math.min(m.material.metalness, 0.3); });
  const holder = new THREE.Group();
  holder.add(obj);
  return holder;
}

// ---------- scene graph ----------
// root: pinned to the room by the gyroscope (counter-rotates the phone's turns)
// world: Amira's world, placed in front of the camera; units = Amira's height
const root = new THREE.Group();
scene.add(root);
const world = new THREE.Group();
world.visible = false;
root.add(world);
const land = new THREE.Group(); // island + props (rises in)
world.add(land);

const island = (() => {
  const g = new THREE.Group();
  const geo = new THREE.CircleGeometry(0.62, 96);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const r = Math.hypot(x, y) / 0.62;
    const a = Math.atan2(y, x);
    const wob = 1 + 0.06 * Math.sin(a * 3 + 1) + 0.03 * Math.sin(a * 7);
    p.setXYZ(i, x * wob, y * wob, 0.06 * Math.pow(Math.max(0, 1 - r * r), 1.4));
  }
  geo.computeVertexNormals();
  geo.rotateX(-Math.PI / 2);
  const sand = tex.load(base('assets/tex/aerial_beach_01_diff.jpg'), (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); });
  sand.colorSpace = THREE.SRGBColorSpace;
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: sand, color: 0xffe3b3, roughness: 1 })));
  // the island floats: a rocky underside tapering to a point
  const rock = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 48, 4, true), new THREE.MeshStandardMaterial({ color: 0x9a7a5c, roughness: 1, side: THREE.DoubleSide }));
  rock.rotation.x = Math.PI;
  rock.position.y = -0.275;
  const rp = rock.geometry.attributes.position;
  for (let i = 0; i < rp.count; i++) rp.setX(i, rp.getX(i) * (1 + Math.sin(i * 1.7) * 0.06));
  rock.geometry.computeVertexNormals();
  g.add(rock);
  // a waterfall of light spilling from the edge
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.6), new THREE.MeshBasicMaterial({
    map: canvasTex(32, 128, (c, w, h) => {
      const grd = c.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(160,240,255,0.9)');
      grd.addColorStop(1, 'rgba(160,240,255,0)');
      c.fillStyle = grd;
      c.fillRect(0, 0, w, h);
    }), transparent: true, depthWrite: false, ...GLOW,
  }));
  fall.position.set(-0.3, -0.3, 0.5);
  g.add(fall);
  const foam = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 6, 96), new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.9 }));
  foam.rotation.x = Math.PI / 2;
  g.add(foam);
  g.userData.foam = foam;
  return g;
})();
land.add(island);

const props = new THREE.Group();
land.add(props);
let cloudTemplate = null;
Promise.all([
  gltf.loadAsync(base('assets/models/palace.glb')),
  gltf.loadAsync(base('assets/models/palm.glb')),
  gltf.loadAsync(base('assets/models/cloud.glb')),
]).then(([palace, palm, cloud]) => {
  const p = fit(palace.scene, 0.75);
  p.position.set(0.05, 0.02, -0.4);
  props.add(p);
  for (const [x, z, h, ry] of [[0.48, -0.12, 0.95, 2.2], [-0.48, -0.15, 0.85, -0.9], [0.42, 0.33, 0.5, 1.2]]) {
    const m = fit(palm.scene.clone(true), h);
    m.position.set(x, 0.02, z);
    m.rotation.y = ry;
    props.add(m);
  }
  cloudTemplate = cloud.scene;
});

// god rays behind Amira
const raysTex = canvasTex(256, 256, (g, s) => {
  g.translate(s / 2, s / 2);
  for (let i = 0; i < 12; i++) {
    g.rotate(Math.PI / 6);
    const grd = g.createLinearGradient(0, 0, s / 2, 0);
    grd.addColorStop(0, 'rgba(255,240,200,0.55)');
    grd.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(s / 2, -10);
    g.lineTo(s / 2, 10);
    g.fill();
  }
});
const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex, transparent: true, depthWrite: false, ...GLOW, opacity: 0 }));
rays.scale.setScalar(2.6);
rays.position.set(0, 0.7, -0.6);
world.add(rays);

// portal: golden ring with a swirling heart and a pillar of light
const portal = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 16, 96), new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffa520, emissiveIntensity: 1.2, metalness: 0.6, roughness: 0.3 }));
portal.add(ring);
const swirl = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64), new THREE.MeshBasicMaterial({
  map: canvasTex(256, 256, (g, s) => {
    g.translate(s / 2, s / 2);
    for (let i = 0; i < 360; i++) {
      const a = i * 0.11, r = i * 0.34;
      g.fillStyle = `hsla(${300 + (i % 60)}, 90%, ${70 + (i % 20)}%, ${0.9 - i / 420})`;
      g.beginPath();
      g.arc(Math.cos(a) * r, Math.sin(a) * r, 4 + i / 40, 0, Math.PI * 2);
      g.fill();
    }
  }), transparent: true, depthWrite: false, ...GLOW,
}));
portal.add(swirl);
portal.add(glowSprite(0xffc36b, 2.2, 0.9));
portal.position.set(0, 0.55, 0);
portal.visible = false;
world.add(portal);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 3, 32, 1, true), new THREE.MeshBasicMaterial({
  map: canvasTex(16, 128, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(255,240,190,0)');
    grd.addColorStop(0.6, 'rgba(255,240,190,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = grd;
    c.fillRect(0, 0, w, h);
  }), transparent: true, depthWrite: false, side: THREE.DoubleSide, ...GLOW,
}));
beam.position.y = 1.5;
beam.visible = false;
world.add(beam);

// ---------- Amira: keyed cartoon billboard ----------
const KEY_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const KEY_FRAG = `
uniform sampler2D map; uniform float glow; uniform float flash; uniform float fade; varying vec2 vUv;
void main(){
  vec4 c = texture2D(map, vUv);
  float g = c.g - max(c.r, c.b);
  float a = 1.0 - smoothstep(0.05, 0.16, g);   // green screen -> transparent
  // the source render has a soft grey floor shadow under her feet: drop neutral greys there
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  if (vUv.y < 0.14 && mx - mn < 0.09 && mx > 0.35 && mx < 0.8) a = 0.0;
  if (a < 0.03) discard;
  c.g = min(c.g, max(c.r, c.b) + 0.03);        // remove green spill on the edges
  vec3 col = c.rgb + glow * vec3(0.18, 0.14, 0.04) + flash * vec3(0.5, 0.2, 0.3);
  gl_FragColor = vec4(col, a * fade);
  #include <colorspace_fragment>
}`;
const stillTex = tex.load(base('assets/amira/still.jpg'));
stillTex.colorSpace = THREE.SRGBColorSpace;
const videoTex = Object.fromEntries(CLIPS.map((n) => {
  const t = new THREE.VideoTexture(videos[n]);
  t.colorSpace = THREE.SRGBColorSpace;
  return [n, t];
}));
const amiraMat = new THREE.ShaderMaterial({
  uniforms: { map: { value: stillTex }, glow: { value: 0 }, flash: { value: 0 }, fade: { value: 1 } },
  vertexShader: KEY_VERT, fragmentShader: KEY_FRAG, transparent: true, side: THREE.DoubleSide, toneMapped: false,
});
const FRAME_H = 1 / 0.74; // the frame is 9:16; she fills 74% of its height, feet 6% above its bottom
const amiraPlane = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_H * 9 / 16, FRAME_H), amiraMat);
amiraPlane.position.y = FRAME_H / 2 - 0.06 * FRAME_H;
const amira = new THREE.Group();
amira.add(amiraPlane);
amira.position.set(0, 0.03, 0.12);
amira.visible = false;
world.add(amira);
const amiraHit = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8), new THREE.MeshBasicMaterial({ visible: false }));
amiraHit.position.y = 0.5;
amira.add(amiraHit);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({
  map: radial([[0, 'rgba(60,30,40,0.5)'], [1, 'rgba(60,30,40,0)']]), transparent: true, depthWrite: false,
}));
shadow.rotation.x = -Math.PI / 2;
shadow.scale.set(1.2, 0.7, 1);
shadow.position.set(0, 0.065, 0.12);
shadow.visible = false;
world.add(shadow);
const HEAD = new THREE.Vector3(0, 0.82, 0.12);

let clip = null;
function playClip(name) {
  const v = videos[name];
  if (!v) return;
  if (clip && clip !== name) videos[clip].pause();
  clip = name;
  v.currentTime = 0;
  // switch to the clip only once it really has frames (no black box on slow loads)
  v.onplaying = () => { if (clip === name) amiraMat.uniforms.map.value = videoTex[name]; };
  v.onended = () => { if (clip === name) { clip = null; amiraMat.uniforms.map.value = stillTex; } };
  v.onerror = v.onended;
  v.play().catch(() => { if (clip === name) clip = null; });
}
let move = null;
function doMove(type, dur) { move = { type, t: 0, dur }; }
const _cam = new THREE.Vector3();
function updateAmira(dt, time) {
  // face the camera, turning only around her vertical axis so she stays upright
  world.updateWorldMatrix(true, false);
  const camLocal = world.worldToLocal(_cam.set(0, 0, 0));
  amira.rotation.y = Math.atan2(camLocal.x - amira.position.x, camLocal.z - amira.position.z);
  rays.material.rotation = time * 0.08;
  amira.position.y = 0.03;
  amiraPlane.scale.set(1, 1 + (clip ? 0 : Math.sin(time * 2.4) * 0.008), 1);
  amiraPlane.position.x = 0;
  if (move) {
    move.t += dt;
    const k = Math.min(1, move.t / move.dur);
    if (move.type === 'hop') amira.position.y += Math.sin(k * Math.PI) * 0.22;
    if (move.type === 'shake') amiraPlane.position.x = Math.sin(k * 40) * 0.03 * (1 - k);
    if (k >= 1) move = null;
  }
  const u = amiraMat.uniforms;
  u.glow.value = Math.max(0, u.glow.value - dt * 0.8);
  u.flash.value = Math.max(0, u.flash.value - dt * 2.5);
}

// ---------- particles, floating text ----------
const sparkles = new Sparkles(1600);
const hearts = new Sparkles(260, heartTexture());
Object.assign(sparkles.points.material, GLOW);
Object.assign(hearts.points.material, GLOW);
world.add(sparkles.points, hearts.points);

const floaters = [];
function floatText(text, pos, color = '#ffd54f', size = 0.16) {
  const t = canvasTex(512, 128, (g, w, h) => {
    g.font = '900 84px Fredoka, "Baloo Bhaijaan 2", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 14;
    g.strokeStyle = 'rgba(70,20,50,0.85)';
    g.strokeText(text, w / 2, h / 2);
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  s.scale.set(size * 4, size, 1);
  s.position.copy(pos);
  s.renderOrder = 10;
  world.add(s);
  floaters.push({ s, t: 0 });
}

// ---------- weather: storm clouds, rain, lightning, rainbow, fireworks ----------
const storm = new THREE.Group();
world.add(storm);
const rainN = 400;
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(rainN * 3), 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xc9a8ff, size: 0.02, transparent: true, opacity: 0.8, depthWrite: false, ...GLOW }));
rain.visible = false;
world.add(rain);
const rp = rainGeo.attributes.position;
for (let i = 0; i < rainN; i++) rp.setXYZ(i, rand(-1.4, 1.4), rand(0, 2.4), rand(-0.8, 0.8));

let bolt = null;
function lightning() {
  if (bolt) world.remove(bolt);
  const pts = [];
  let p = new THREE.Vector3(rand(-0.9, 0.9), 2.1, rand(-0.5, 0.2));
  for (let i = 0; i < 9; i++) { pts.push(p.clone()); p = p.add(new THREE.Vector3(rand(-0.15, 0.15), -0.24, rand(-0.05, 0.05))); }
  bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xf0d8ff, transparent: true, ...GLOW }));
  world.add(bolt);
  setTimeout(() => { if (bolt) { world.remove(bolt); bolt = null; } }, 160);
  $('flash').style.background = '#e8d8ff';
  $('flash').classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => $('flash').classList.remove('on')));
  setTimeout(() => music.thunder(), 150);
  document.body.classList.remove('shake');
  void document.body.offsetWidth;
  document.body.classList.add('shake');
  buzz(60);
}

const rainbow = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 16, 96, Math.PI), new THREE.MeshBasicMaterial({
  map: canvasTex(4, 64, (c, w, h) => {
    ['#ff5a5a', '#ffa64d', '#ffe14d', '#6be36b', '#4dc3ff', '#7a6bff', '#c56bff'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, (i * h) / 7, w, h / 7 + 1); });
  }), transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide,
}));
rainbow.position.set(0, 0.15, -0.75);
rainbow.visible = false;
world.add(rainbow);

const rockets = [];
function firework() {
  const from = new THREE.Vector3(rand(-1, 1), 0.1, rand(-0.6, 0.2));
  rockets.push({ p: from, v: new THREE.Vector3(rand(-0.1, 0.1), rand(1.6, 2.1), 0), t: 0, life: rand(0.8, 1.1), col: pick([0xffd54f, 0xff6fa5, 0x7fe7ff, 0xb388ff, 0x9cff8a]) });
  music.whoosh();
}

// ---------- the products' moment ----------
const pedestal = new THREE.Group();
// beside Amira, a little in front, so it never hides her dress
pedestal.position.set(0.42, 0, 0.3);
pedestal.userData.s = 0.75;
pedestal.visible = false;
world.add(pedestal);
const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.06, 64), new THREE.MeshPhysicalMaterial({ color: 0xfff3e6, roughness: 0.3, clearcoat: 0.8 }));
plinth.position.y = 0.03;
pedestal.add(plinth);
const trim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 8, 96), new THREE.MeshStandardMaterial({ color: 0xd9a23a, metalness: 0.9, roughness: 0.25 }));
trim.rotation.x = Math.PI / 2;
trim.position.y = 0.06;
pedestal.add(trim);
const spot = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.6, 32, 1, true), new THREE.MeshBasicMaterial({
  map: canvasTex(8, 64, (c, w, h) => {
    const grd = c.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(255,240,200,0)');
    grd.addColorStop(1, 'rgba(255,240,200,0.14)');
    c.fillStyle = grd;
    c.fillRect(0, 0, w, h);
  }), transparent: true, depthWrite: false, side: THREE.DoubleSide, ...GLOW,
}));
spot.position.y = 0.85;
pedestal.add(spot);
loadProducts(new URL('../assets/', import.meta.url), manager, 0.3).then((packs) => {
  packs.forEach((p, i) => {
    p.object.position.set((i - 1) * 0.17, 0.06, Math.abs(i - 1) * -0.05);
    p.object.rotation.y = (1 - i) * 0.25;
    pedestal.add(p.object);
  });
});

// ---------- tweens & story helpers ----------
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }
const tweenP = (dur, fn) => new Promise((r) => tween(dur, fn, r));
const ease = (k) => 1 - Math.pow(1 - k, 3);
const back = (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
function setTint(mode) { tint.className = mode || ''; }
async function chapterCard(n) {
  const c = $('chapter');
  $('chap-num').textContent = n <= 3 ? T().chapter(n) : T().finaleTag;
  $('chap-name').textContent = T().chapters[n - 1];
  c.classList.remove('out');
  c.hidden = false;
  music.shimmer();
  await wait(2000);
  c.classList.add('out');
  await wait(700);
  c.hidden = true;
}

// ---------- game pieces ----------
const items = new THREE.Group();
world.add(items);
function makeBody(kind) {
  const g = new THREE.Group();
  if (kind === 'berries') {
    const geo = new THREE.SphereGeometry(0.07, 32, 24);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + Math.cos(Math.atan2(v.z, v.x) * 6) * 0.03 * (1 - Math.abs(v.y) / 0.07));
      p.setXYZ(i, v.x, v.y * 0.92, v.z);
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xb7d96a, roughness: 0.25, clearcoat: 1 })));
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.035, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2a }));
    stem.position.y = 0.07;
    g.add(stem);
  } else if (kind === 'bubbles') {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), new THREE.MeshPhysicalMaterial({
      color: 0xe8f7ff, transparent: true, opacity: 0.55, roughness: 0, metalness: 0.2, emissive: 0x3a6a90, emissiveIntensity: 0.35,
      iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 900], depthWrite: false,
    })));
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.position.set(-0.033, 0.038, 0.058);
    g.add(hl);
  } else if (kind === 'sparkles' || kind === 'star') {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.035 : 0.085;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 });
    geo.center();
    const gold = kind === 'star';
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: gold ? 0xffc928 : 0xff8fc8, metalness: 0.5, roughness: 0.25, emissive: gold ? 0x664400 : 0x551133 })));
  } else if (kind === 'knot') {
    const geo = new THREE.IcosahedronGeometry(0.08, 3);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + Math.sin(v.x * 90) * Math.cos(v.y * 80) * Math.sin(v.z * 70) * 0.18);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6b2fa8, roughness: 0.85, emissive: 0x2a0b45 })));
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      eye.position.set(s * 0.028, 0.012, 0.07);
      eye.scale.set(1, 0.75, 0.6);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), new THREE.MeshBasicMaterial({ color: 0x1a0626 }));
      pupil.position.set(s * 0.028, 0.008, 0.083);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.007, 0.006), new THREE.MeshBasicMaterial({ color: 0x1a0626 }));
      brow.position.set(s * 0.028, 0.036, 0.078);
      brow.rotation.z = s * -0.5;
      g.add(eye, pupil, brow);
    }
  }
  return g;
}
const GLOW_COL = { berries: 0xffd54f, bubbles: 0x9fe8ff, sparkles: 0xff8fc8, star: 0xffd54f, knot: 0xb06cff };
function makeItem(kind, behaviour) {
  const g = new THREE.Group();
  const body = makeBody(kind);
  g.add(body);
  g.add(glowSprite(GLOW_COL[kind], kind === 'star' ? 0.42 : 0.3, kind === 'star' ? 1 : 0.7));
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.item = g;
  g.add(hit);
  g.userData = { kind, behaviour, body, alive: true, counts: true, t: 0, seed: Math.random() * 10, a: rand(0, Math.PI * 2), r: rand(0.45, 0.85), h: rand(0.25, 1.15), speed: rand(0.5, 0.9) * (Math.random() < 0.5 ? 1 : -1) };
  if (behaviour === 'attack') {
    const a = rand(-1.3, 1.3) + (Math.random() < 0.5 ? 0 : Math.PI);
    g.position.set(Math.sin(a) * 1.1, rand(0.4, 1.3), Math.cos(a) * 0.9 + 0.3);
    g.userData.speed = rand(0.16, 0.24) + game.wave * 0.02;
  }
  g.scale.setScalar(0.01);
  items.add(g);
  return g;
}

// ---------- story ----------
function renderHud() {
  $('score-num').textContent = game.score;
  $('hearts').textContent = '❤️'.repeat(game.hearts) + '🤍'.repeat(3 - game.hearts);
  $('wave-fill').style.width = `${Math.min(100, (game.got / Math.max(1, game.need)) * 100)}%`;
  $('wave-num').textContent = `${game.wave}/3`;
}
function setMission(k) {
  game.waveKey = k;
  const m = $('mission');
  m.hidden = false;
  m.textContent = T().missions[k];
  m.style.animation = 'none';
  void m.offsetWidth;
  m.style.animation = '';
}
function clearItems() { for (const c of [...items.children]) items.remove(c); }

async function chapter(n) {
  game.phase = 'cut';
  clearItems();
  $('mission').hidden = true;
  game.wave = n;
  game.got = 0;
  game.spawnT = 0;
  renderHud();
  $('bars').classList.add('on');
  if (n === 2) {
    // the sky turns: purple storm rolls in
    music.start('storm');
    setTint('storm');
    rain.visible = true;
    rays.material.opacity = 0;
    if (cloudTemplate) {
      for (let i = 0; i < 5; i++) {
        const c = fit(cloudTemplate.clone(true), rand(0.25, 0.4));
        c.position.set(rand(-1.2, 1.2), rand(1.6, 2.2), rand(-0.8, -0.2));
        c.userData.drift = rand(0.1, 0.25) * (Math.random() < 0.5 ? -1 : 1);
        c.scale.multiplyScalar(0.01);
        storm.add(c);
        tween(1.5, (k) => c.scale.setScalar(Math.max(0.01, ease(k))));
      }
    }
    lightning();
    setTimeout(lightning, 1400);
  }
  if (n === 3) {
    music.start('boss');
    lightning();
  }
  await chapterCard(n);
  speak(['ch1', 'ch2', 'ch3'][n - 1]);
  playClip(n === 1 ? 'wave' : 'magic');
  if (n === 1) { game.need = 10; setMission(TARGETS[game.target].theme); }
  if (n === 2) { game.need = 8; setMission('knots'); }
  if (n === 3) { game.need = 14; game.bossHp = 14; setMission('boss'); spawnBoss(); }
  renderHud();
  // bars slide away while playing so the score and hearts are visible
  $('bars').classList.remove('on');
  game.phase = 'play';
}
function waveCleared() {
  if (game.phase !== 'play') return;
  game.phase = 'cut';
  clearItems();
  play('combo');
  playClip('cheer');
  amiraMat.uniforms.glow.value = 1;
  sparkles.burst(HEAD.clone(), [0xffd54f, 0xffffff, TARGETS[game.target].color], 140, { speed: 1.1, up: 0.4, life: 1.6 });
  setTimeout(() => chapter(game.wave + 1), 2200);
}

function addScore(points, pos) {
  const now = performance.now();
  game.combo = now - game.lastHit < 1100 ? game.combo + 1 : 1;
  game.lastHit = now;
  const mult = Math.min(game.combo, 5);
  game.score += points * mult;
  floatText(`+${points * mult}`, pos.clone().add(new THREE.Vector3(0, 0.12, 0)));
  if (game.combo >= 3) {
    floatText(`${T().combo} x${mult}!`, new THREE.Vector3(0, 1.35, 0.2), '#ff7ab6', 0.2);
    if (game.combo === 3 || game.combo === 5) play('combo');
  }
  renderHud();
}
function hitItem(it) {
  const u = it.userData;
  if (!u.alive || game.phase !== 'play') return;
  u.alive = false;
  buzz(15);
  const p = it.position.clone();
  if (u.kind === 'berries' || u.kind === 'star' || u.kind === 'sparkles') {
    play(u.kind === 'star' ? 'star' : 'berry');
    const from = p.clone();
    tween(0.45, (k) => { it.position.lerpVectors(from, HEAD, k * k); it.scale.setScalar(1 - k * 0.8); }, () => {
      items.remove(it);
      amiraMat.uniforms.glow.value = Math.min(1, amiraMat.uniforms.glow.value + 0.5);
      sparkles.burst(HEAD.clone(), [0xffd54f, 0xfff3a0, 0xffffff], 40, { speed: 0.5, up: 0.1, life: 1.1 });
    });
  } else {
    play('pop');
    tween(0.1, (k) => it.scale.setScalar(1 + k * 0.7), () => items.remove(it));
    sparkles.burst(p, u.kind === 'knot' ? [0xb06cff, 0xff8fc8, 0xffffff] : [0x9fe8ff, 0xffffff, 0xffb3e6], 50, { speed: 0.9, up: 0.15, life: 1 });
  }
  addScore(u.kind === 'star' ? 50 : u.kind === 'knot' ? 15 : 10, p);
  if (u.kind !== 'star' && u.counts) game.got++;
  renderHud();
  if (game.wave < 3 && game.got >= game.need) setTimeout(waveCleared, 400);
}
function knotReachedHair(it) {
  it.userData.alive = false;
  items.remove(it);
  play('hurt');
  buzz(90);
  sparkles.burst(HEAD.clone(), [0x6b2fa8, 0xb06cff], 40, { speed: 0.6, life: 0.9 });
  amiraMat.uniforms.flash.value = 1;
  doMove('shake', 0.5);
  speak('ouch', { interrupt: false });
  game.hearts = Math.max(0, game.hearts - 1);
  game.combo = 0;
  if (it.userData.counts) game.got++;
  renderHud();
  if (game.wave < 3 && game.got >= game.need) setTimeout(waveCleared, 400);
}

let boss = null;
function spawnBoss() {
  if (!cloudTemplate) return;
  boss = new THREE.Group();
  const m = fit(cloudTemplate.clone(true), 0.6);
  m.position.y -= 0.3;
  boss.add(m);
  boss.add(glowSprite(0x9b4dff, 1.3, 0.7));
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
  boss.add(hit);
  boss.position.set(0, 2.6, 0.1);
  boss.userData = { t: 0, shot: 0, size: 1, hitT: 0 };
  world.add(boss);
  play('cloud');
}
function hitBoss() {
  if (!boss || game.phase !== 'play') return;
  play('hit');
  buzz(20);
  game.bossHp--;
  game.got++;
  boss.userData.size = 0.45 + 0.55 * (game.bossHp / game.need);
  boss.userData.hitT = 0.25;
  const p = boss.position.clone();
  sparkles.burst(p, [0xb06cff, 0xffd54f, 0xffffff], 35, { speed: 1, up: 0.2, life: 0.9 });
  addScore(20, p);
  if (game.bossHp % 5 === 0) lightning();
  renderHud();
  if (game.bossHp <= 0) defeatBoss();
}
function defeatBoss() {
  game.phase = 'cut';
  clearItems();
  playClip('magic');
  const b = boss;
  tween(1.6, (k) => {
    for (let n = 0; n < 8; n++) sparkles.emit(HEAD.clone().lerp(b.position, Math.random() * k), pick([0xffd54f, 0xff8fc8, 0xffffff]), { speed: 0.15, up: 0, life: 0.6 });
    b.rotation.z = Math.sin(k * 50) * 0.2;
  }, () => {
    music.boom();
    buzz(150);
    sparkles.burst(b.position.clone(), [0xb06cff, 0xffd54f, 0xff8fc8, 0x7fe7ff, 0xffffff], 400, { speed: 2, up: 0.3, life: 2.4 });
    world.remove(b);
    boss = null;
    game.score += 200;
    floatText('+200', b.position.clone(), '#ffd54f', 0.24);
    renderHud();
    setTimeout(finale, 900);
  });
}

async function finale() {
  game.phase = 'cut';
  $('mission').hidden = true;
  $('bars').classList.add('on');
  // the storm clears into sunshine
  music.start('celebrate');
  setTint('sunny');
  rain.visible = false;
  for (const c of [...storm.children]) tween(1.2, (k) => { c.position.y += 0.03; c.scale.multiplyScalar(0.96); }, () => storm.remove(c));
  tween(2, (k) => { rays.material.opacity = ease(k) * 0.9; });
  await chapterCard(4);
  rainbow.visible = true;
  rainbow.scale.setScalar(0.01);
  tween(1.6, (k) => { rainbow.scale.setScalar(Math.max(0.01, ease(k))); rainbow.material.opacity = ease(k) * 0.75; });
  playClip('dance');
  speak('win');
  game.fireworks = 10;
  // the three packs rise on a spotlit pedestal
  setTimeout(() => {
    pedestal.visible = true;
    music.rise();
    tween(1.6, (k) => { pedestal.position.y = -0.6 * (1 - ease(k)); pedestal.scale.setScalar(Math.max(0.01, back(k)) * pedestal.userData.s); });
  }, 2500);
  setTimeout(showWin, 5200);
}
function showWin() {
  game.phase = 'won';
  const t = TARGETS[game.target];
  const stars = Math.max(1, game.hearts);
  $('win-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  $('win-score').textContent = `${T().score}: ${game.score}`;
  $('win-line').textContent = t.product === null ? T().cardWin : STRINGS[lang].productLines[t.product];
  $('win').hidden = false;
  $('hud-game').hidden = true;
  $('bars').classList.remove('on');
  setTimeout(() => {
    $('win').hidden = true;
    $('btn-again').hidden = false;
    speak('photo');
  }, 6000);
}

// ---------- which pack is it? ----------
const PACK_HUES = [{ i: 0, hue: 28 }, { i: 1, hue: 335 }, { i: 2, hue: 275 }];
const probe = document.createElement('canvas');
probe.width = 160;
probe.height = 120;
function identifyPack(anchor, fallback) {
  const video = mindar.video;
  if (!video || !video.videoWidth) return fallback;
  const g = probe.getContext('2d', { willReadFrequently: true });
  g.drawImage(video, 0, 0, probe.width, probe.height);
  const cr = container.getBoundingClientRect();
  const vr = video.getBoundingClientRect();
  const h = TARGETS[fallback].height;
  anchor.group.updateWorldMatrix(true, false);
  camera.updateMatrixWorld();
  let hx = 0, hy = 0, w = 0;
  const hsl = {};
  const col = new THREE.Color();
  for (const [x, y] of [[0, 0.44], [-0.05, -0.08], [0.08, -0.12], [-0.3, -0.43], [0.3, -0.43], [0, -0.46]]) {
    const v = new THREE.Vector3(x, y * h, 0).applyMatrix4(anchor.group.matrixWorld).project(camera);
    const px = Math.round((((v.x + 1) / 2 * cr.width + cr.left - vr.left) / vr.width) * probe.width);
    const py = Math.round((((1 - v.y) / 2 * cr.height + cr.top - vr.top) / vr.height) * probe.height);
    if (px < 2 || py < 2 || px >= probe.width - 2 || py >= probe.height - 2) continue;
    const d = g.getImageData(px - 2, py - 2, 5, 5).data;
    for (let k = 0; k < d.length; k += 4) {
      col.setRGB(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255, THREE.SRGBColorSpace).getHSL(hsl);
      if (hsl.s < 0.3 || hsl.l < 0.12 || hsl.l > 0.88) continue;
      hx += Math.cos(hsl.h * Math.PI * 2) * hsl.s;
      hy += Math.sin(hsl.h * Math.PI * 2) * hsl.s;
      w += hsl.s;
    }
  }
  if (w < 1) return fallback;
  const hue = ((Math.atan2(hy, hx) / (Math.PI * 2)) * 360 + 360) % 360;
  const dist = (a, c) => Math.min(Math.abs(a - c), 360 - Math.abs(a - c));
  return PACK_HUES.reduce((best, p) => (dist(hue, p.hue) < dist(hue, best.hue) ? p : best)).i;
}

// ---------- gyroscope: pin the world in the room ----------
const gyro = { q: null, q0: null };
const _euler = new THREE.Euler();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // camera looks out the back of the device
const _z = new THREE.Vector3(0, 0, 1);
function onOrient(e) {
  if (e.alpha == null) return;
  const d = THREE.MathUtils.DEG2RAD;
  const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * d;
  _euler.set(e.beta * d, e.alpha * d, -e.gamma * d, 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(_euler).multiply(_q1).multiply(new THREE.Quaternion().setFromAxisAngle(_z, -orient));
  gyro.q = q;
}
function pinWorld() { gyro.q0 = gyro.q ? gyro.q.clone() : null; }
function updateGyro() {
  if (!gyro.q || !gyro.q0) { root.quaternion.identity(); return; }
  // objects fixed in the room appear rotated by the inverse of the phone's turn
  root.quaternion.copy(gyro.q).invert().multiply(gyro.q0);
}

// ---------- the awakening: from the scanned pack to the world ----------
let started = false;
async function onFound(found, anchor) {
  if (!ready || started) return;
  started = true;
  $('scan-hint').hidden = true;
  const i = TARGETS[found].id === 'card' ? found : identifyPack(anchor, found);
  game.target = i;
  const col = TARGETS[i].color;
  // 1) the pack awakens: a burst of light on the label itself
  anchor.group.updateWorldMatrix(true, false);
  const packPos = new THREE.Vector3().setFromMatrixPosition(anchor.group.matrixWorld);
  const halo = glowSprite(col, 2.5, 0);
  anchor.group.add(halo);
  music.unlock();
  music.whoosh();
  play('place');
  buzz(40);
  tween(1.1, (k) => { halo.material.opacity = Math.sin(k * Math.PI) * 1.0; halo.scale.setScalar(1 + k * 3); }, () => anchor.group.remove(halo));
  // 2) place the world in front of the camera, centred and big
  const D = THREE.MathUtils.clamp(packPos.length() * 1.25, 1, 1e6);
  const visH = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visW = visH * camera.aspect;
  const S = Math.min(0.46 * visH, 0.72 * visW);
  pinWorld();
  updateGyro();
  world.position.set(0, -0.22 * visH, -D);
  world.scale.setScalar(S);
  world.visible = true;
  land.visible = false;
  // 3) magic streams from the pack to the middle of the screen
  world.updateWorldMatrix(true, true);
  const fromLocal = world.worldToLocal(packPos.clone());
  await tweenP(1.2, (k) => {
    for (let n = 0; n < 10; n++) {
      const p = fromLocal.clone().lerp(new THREE.Vector3(0, 0.55, 0), Math.min(1, k + rand(-0.15, 0.05)));
      sparkles.emit(p, pick([col, 0xffd54f, 0xffffff]), { speed: 0.12, up: 0.05, life: 0.8 });
    }
  });
  mindar.controller?.stopProcessVideo?.(); // tracking's job is done; save the battery
  // 4) the portal opens; cinematic bars; title card; music
  $('bars').classList.add('on');
  setTint('magic');
  music.start('magic');
  portal.visible = true;
  portal.scale.setScalar(0.01);
  music.shimmer();
  tween(1.2, (k) => portal.scale.setScalar(Math.max(0.01, back(k))));
  $('title-card').classList.remove('out');
  $('title-card').hidden = false;
  await wait(3200);
  $('title-card').classList.add('out');
  setTimeout(() => { $('title-card').hidden = true; }, 700);
  // 5) the island rises through the portal
  music.rise();
  land.visible = true;
  land.position.y = -1.2;
  land.scale.setScalar(0.3);
  props.children.forEach((p) => p.scale.setScalar(0.01));
  await tweenP(1.8, (k) => {
    const e = ease(k);
    land.position.y = -1.2 * (1 - e);
    land.scale.setScalar(0.3 + 0.7 * e);
    for (let n = 0; n < 4; n++) sparkles.emit(new THREE.Vector3(rand(-0.6, 0.6), land.position.y, rand(-0.4, 0.5)), pick([0xffd54f, 0xffffff, col]), { speed: 0.2, up: 0.4, life: 1.2 });
  });
  for (const [n, p] of props.children.entries()) {
    setTimeout(() => { play('tap'); tween(0.6, (k) => p.scale.setScalar(Math.max(0.01, back(k)))); }, n * 220);
  }
  tween(1.0, (k) => { portal.scale.setScalar(Math.max(0.01, 1 - k)); }, () => { portal.visible = false; });
  tween(2, (k) => { rays.material.opacity = ease(k) * 0.8; });
  await wait(900);
  // 6) Amira arrives in a pillar of light
  beam.visible = true;
  beam.material.opacity = 0;
  await tweenP(0.6, (k) => { beam.material.opacity = k; });
  music.shimmer();
  amira.visible = true;
  shadow.visible = true;
  amiraMat.uniforms.fade.value = 0;
  sparkles.burst(new THREE.Vector3(0, 0.5, 0.12), [col, 0xffd54f, 0xffffff], 260, { speed: 1.4, up: 0.4, life: 1.8 });
  tween(0.8, (k) => { amiraMat.uniforms.fade.value = k; });
  tween(1.4, (k) => { beam.material.opacity = 1 - k; }, () => { beam.visible = false; });
  playClip('wave');
  doMove('hop', 0.5);
  speak('intro');
  $('actions').hidden = false;
  $('hud-game').hidden = false;
  await wait(4200);
  chapter(1);
}

TARGETS.forEach((_, i) => {
  const a = mindar.addAnchor(i);
  a.onTargetFound = () => onFound(i, a);
});

// ---------- tapping ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
container.addEventListener('pointerdown', (e) => {
  if (!world.visible) return;
  const r = container.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(items.children, true).find((h) => h.object.userData.item?.userData.alive);
  if (hit) { hitItem(hit.object.userData.item); return; }
  if (boss && raycaster.intersectObject(boss, true).length) { hitBoss(); return; }
  if (amira.visible && raycaster.intersectObject(amiraHit).length) tickle();
  else if (game.phase === 'won') { firework(); }
});
function tickle() {
  play('giggle');
  doMove('hop', 0.5);
  if (!clip) playClip(pick(['wave', 'cheer', 'dance']));
  hearts.burst(new THREE.Vector3(0, 0.85, 0.2), [0xff6fa5, 0xff9ec4, 0xf0628f], 18, { speed: 0.5, up: 0.4, life: 1.5 });
  speak('tickle', { interrupt: false });
}

// ---------- buttons ----------
$('btn-dance').onclick = () => {
  if (!world.visible) return;
  playClip('dance');
  for (let n = 0; n < 4; n++) setTimeout(firework, n * 600);
  for (let n = 0; n < 10; n++) setTimeout(() => hearts.burst(new THREE.Vector3(rand(-0.4, 0.4), rand(0.4, 1.1), 0.2), [0xff6fa5, 0xff9ec4], 3, { speed: 0.3, up: 0.3, life: 1.4 }), n * 450);
};
$('btn-again').onclick = () => location.reload();

let shotBlob = null;
$('btn-photo').onclick = () => {
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
  // bake the colour grade into the photo too
  const grd = g.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H / 2, H * 0.75);
  grd.addColorStop(0, 'rgba(255,220,160,0.08)');
  grd.addColorStop(1, 'rgba(120,40,120,0.4)');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
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
  $('flash').style.background = '#fff';
  $('flash').classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => $('flash').classList.remove('on')));
  c.toBlob((b) => { shotBlob = b; $('shot-img').src = URL.createObjectURL(b); $('shot').hidden = false; }, 'image/jpeg', 0.92);
};
$('btn-share').onclick = async () => {
  if (!shotBlob) return;
  const file = new File([shotBlob], 'amira-photo.jpg', { type: 'image/jpeg' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Princess Amira' }); return; }
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
  music.setMuted(sound.muted);
  if (voice) voice.muted = sound.muted;
  $('btn-sound').textContent = sound.muted ? '🔇' : '🔊';
};
$('btn-close').onclick = () => location.reload();

// ---------- main loop ----------
let ready = false;
// tests run in a slow software renderer: let animations keep real time there
const SLOW_OK = new URLSearchParams(location.search).has('debug');
const _v = new THREE.Vector3();
function frame(dt, time) {
  for (let k = tweens.length - 1; k >= 0; k--) {
    const tw = tweens[k];
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.dur);
    tw.fn(p);
    if (p >= 1) { tweens.splice(k, 1); tw.done?.(); }
  }
  updateGyro();
  if (!world.visible) { sparkles.update(dt); return; }
  updateAmira(dt, time);
  island.userData.foam.scale.setScalar(1 + Math.sin(time * 1.4) * 0.015);
  land.position.y += Math.sin(time * 0.9) * 0.0006; // the island gently floats
  portal.rotation.z = time * 0.6;
  swirl.rotation.z = -time * 2;

  // spawning
  if (game.phase === 'play') {
    game.spawnT += dt;
    const alive = items.children.filter((c) => c.userData.alive);
    if (game.wave === 1 && game.spawnT > 0.7 && alive.length < 4) { game.spawnT = 0; makeItem(Math.random() < 0.15 ? 'star' : TARGETS[game.target].theme, 'orbit'); }
    if (game.wave === 2 && game.spawnT > 1.3 && alive.length < 3) { game.spawnT = 0; makeItem('knot', 'attack'); }
    if (game.wave === 3 && boss) {
      boss.userData.shot += dt;
      if (boss.userData.shot > 3 && alive.length < 2) {
        boss.userData.shot = 0;
        const k = makeItem('knot', 'attack');
        k.position.copy(boss.position);
        k.userData.counts = false;
      }
    }
    if (game.wave >= 2 && Math.random() < dt / 7) lightning();
  }
  // pieces
  for (const it of items.children) {
    const u = it.userData;
    if (!u.alive) continue;
    u.t += dt;
    it.scale.setScalar(Math.min(1, u.t * 3));
    if (u.behaviour === 'orbit') {
      u.a += u.speed * dt;
      let h = u.h + Math.sin(time * 2 + u.seed) * 0.08;
      if (u.kind === 'bubbles') { u.h += dt * 0.07; if (u.h > 1.3) u.h = 0.25; h = u.h; }
      it.position.set(Math.cos(u.a) * u.r, h, Math.sin(u.a * 2) * 0.35 + 0.3 + Math.sin(u.a) * 0.25);
      u.body.rotation.y += dt * 1.5;
    } else {
      const to = HEAD.clone().sub(it.position);
      if (to.length() < 0.16) { knotReachedHair(it); continue; }
      it.position.addScaledVector(to.normalize(), u.speed * dt);
      it.position.y += Math.sin(time * 5 + u.seed) * 0.004;
      u.body.rotation.y += dt * 3;
      u.body.rotation.z = Math.sin(time * 7 + u.seed) * 0.3;
    }
  }
  // boss
  if (boss) {
    const b = boss.userData;
    b.t += dt;
    boss.position.y += (1.15 - boss.position.y) * Math.min(1, dt * 1.2);
    boss.position.x = Math.sin(b.t * 0.8) * 0.45;
    b.hitT = Math.max(0, b.hitT - dt);
    boss.scale.setScalar(b.size * (1 + b.hitT * 0.6));
    boss.rotation.z = Math.sin(b.t * 2) * 0.08 + (b.hitT ? Math.sin(b.t * 60) * 0.15 : 0);
    if (Math.random() < 0.4) sparkles.emit(boss.position.clone().add(_v.set(rand(-0.3, 0.3), -0.25, 0)), 0x9b4dff, { speed: 0.1, up: -0.25, life: 1 });
  }
  // storm clouds drift, rain falls
  for (const c of storm.children) { c.position.x += c.userData.drift * dt; if (Math.abs(c.position.x) > 1.5) c.userData.drift *= -1; }
  if (rain.visible) {
    for (let i = 0; i < rainN; i++) {
      let y = rp.getY(i) - dt * rand(1.6, 2.2);
      if (y < 0) y = 2.4;
      rp.setY(i, y);
    }
    rp.needsUpdate = true;
  }
  // fireworks
  if (game.fireworks > 0 && Math.random() < dt * 1.6) { game.fireworks--; firework(); }
  for (let k = rockets.length - 1; k >= 0; k--) {
    const r = rockets[k];
    r.t += dt;
    r.v.y -= dt * 1.2;
    r.p.addScaledVector(r.v, dt);
    sparkles.emit(r.p.clone(), 0xfff3c0, { speed: 0.03, up: -0.1, life: 0.4 });
    if (r.t > r.life) {
      rockets.splice(k, 1);
      music.boom();
      sparkles.burst(r.p.clone(), [r.col, r.col, 0xffffff], 150, { speed: 1.4, up: 0, life: 1.8 });
    }
  }
  if (game.phase === 'won' || game.phase === 'cut') {
    if (pedestal.visible) pedestal.children.forEach((c, n) => { if (n >= 3) c.rotation.y += dt * 0.4 * (n % 2 ? 1 : -1); });
  }
  // floating text
  for (let k = floaters.length - 1; k >= 0; k--) {
    const f = floaters[k];
    f.t += dt;
    f.s.position.y += dt * 0.35;
    f.s.material.opacity = Math.max(0, 1 - f.t / 0.9);
    if (f.t > 0.9) { world.remove(f.s); f.s.material.map.dispose(); floaters.splice(k, 1); }
  }
  // ambient magic: fireflies drifting through the scene
  if (Math.random() < 0.6) sparkles.emit(new THREE.Vector3(rand(-1, 1), rand(0.1, 1.6), rand(-0.6, 0.6)), pick([0xffe082, 0xfff6d6, 0xffb3e6]), { speed: 0.05, up: 0.08, life: 2 });
  const s = world.matrixWorld.getMaxScaleOnAxis();
  sparkles.points.material.size = 0.045 * s;
  hearts.points.material.size = 0.09 * s;
  sparkles.update(dt);
  hearts.update(dt);
}

$('btn-start').onclick = async () => {
  music.unlock();
  $('btn-start').disabled = true;
  for (const v of Object.values(videos)) v.play().then(() => v.pause()).catch(() => {}); // iOS: unlock clips in the tap
  // iOS asks for motion access in the tap; without it the world simply stays camera-locked
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) await DeviceOrientationEvent.requestPermission();
  } catch { /* declined: fine */ }
  window.addEventListener('deviceorientation', onOrient);
  status.textContent = T().camera;
  try {
    await mindar.start();
    container.insertBefore(tint, renderer.domElement);
    ready = true;
    $('intro').hidden = true;
    $('hud').hidden = false;
    $('scan-hint').hidden = false;
    status.textContent = '';
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), SLOW_OK ? 0.3 : 0.1);
      frame(dt, clock.elapsedTime);
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
  window.amiraScan = { game, items, hitItem, hitBoss, tickle, chapter, camera, container, THREE, get boss() { return boss; } };
}
