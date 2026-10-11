// Amira Magic Scan — point the camera at a Dabur Amla Kids pack (or the Amira card):
// a little 3D island grows beside it, Princess Amira steps onto it, and a
// three-wave game begins:
//   Wave 1  catch the pack's magic items (berries / bubbles / stars) flying around
//   Wave 2  tangle knots attack her hair — pop them before they reach her (3 hearts)
//   Wave 3  boss: the Tangle Cloud — tap it to shrink it, then Amira finishes it
// Amira herself is the series' own cartoon render, animated with generated clips
// that are chroma-keyed live, so she looks exactly like the cartoon. Everything
// around her (island, palace, palms, game pieces, boss) is real 3D.
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sparkles, heartTexture, play, sound, unlockAudio } from '../src/effects.js';
import { STRINGS } from '../src/i18n.js';

// ---------- copy ----------
const UI = {
  ar: {
    eyebrow: 'سحر دابر آملا كيدز',
    title: 'امسحي… والعبي مع الأميرة أميرة!',
    subtitle: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة، وستظهر جزيرة أميرة السحرية بجانبها ✨',
    start: '📷 افتحي الكاميرا',
    loading: 'جاري تحميل عالم أميرة…',
    camera: 'جاري تشغيل الكاميرا…',
    cameraError: 'لم نتمكن من فتح الكاميرا. اسمحي بالوصول إلى الكاميرا ثم حاولي مجدداً.',
    scanHint: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة',
    lang: 'English',
    hello: 'مرحباً! أنا الأميرة أميرة 👑 ساعديني!',
    waves: {
      berries: 'الجولة ١: المسي حبّات الآملا الذهبية! ✨',
      bubbles: 'الجولة ١: فرقعي فقاعات السحر! 🫧',
      sparkles: 'الجولة ١: اجمعي النجوم السحرية! ⭐',
      knots: 'الجولة ٢: عُقد التشابك تهاجم! فرقعيها قبل أن تصل لشعري! 💥',
      boss: 'الجولة ٣: غيمة التشابك! المسيها بسرعة! 🌩️',
    },
    cleared: ['رائع! الجولة التالية! 🎉', 'أنتِ بطلة! ⭐'],
    cheers: ['رائع! ✨', 'أحسنتِ! 💖', 'يا سلام! 🌟'],
    ouch: 'آي! عقدة في شعري! 😣',
    tickle: ['هههه! هذا يدغدغ! 😆', 'وييييي! 🌟', 'أنتِ صديقتي المفضلة! 💖'],
    combo: 'كومبو',
    winTitle: 'هزمتِ غيمة التشابك! 🎉',
    cardWin: 'لا تشابك بعد اليوم! هذا هو سحر آملا كيدز ✨',
    score: 'النقاط',
    dance: '💃 رقصة',
    photo: '📸 صورة مع أميرة',
    again: '🔄 العبي مجدداً',
    share: 'حفظ / مشاركة الصورة',
    back: 'رجوع',
    afterWin: 'المسيني لأضحك، أو التقطي صورة معي! 📸',
  },
  en: {
    eyebrow: 'Dabur Amla Kids magic',
    title: 'Scan it… and play with Princess Amira!',
    subtitle: "Point your camera at an Amla Kids pack or the Amira card, and Amira's magic island appears beside it ✨",
    start: '📷 Open camera',
    loading: "Loading Amira's world…",
    camera: 'Starting camera…',
    cameraError: "We couldn't open the camera. Allow camera access, then try again.",
    scanHint: 'Point your camera at an Amla Kids pack or the Amira card',
    lang: 'العربية',
    hello: "Hi! I'm Princess Amira 👑 Help me!",
    waves: {
      berries: 'Wave 1: tap the golden amla berries! ✨',
      bubbles: 'Wave 1: pop the magic bubbles! 🫧',
      sparkles: 'Wave 1: catch the magic stars! ⭐',
      knots: 'Wave 2: tangle knots attack! Pop them before they reach my hair! 💥',
      boss: 'Wave 3: the Tangle Cloud! Tap it fast! 🌩️',
    },
    cleared: ['Yay! Next wave! 🎉', "You're a star! ⭐"],
    cheers: ['Yay! ✨', 'Great job! 💖', 'Wow! 🌟'],
    ouch: 'Ouch! A knot in my hair! 😣',
    tickle: ['Hehe! That tickles! 😆', 'Wheeee! 🌟', "You're my best friend! 💖"],
    combo: 'COMBO',
    winTitle: 'You beat the Tangle Cloud! 🎉',
    cardWin: "No more tangles! That's Dabur Amla Kids magic ✨",
    score: 'Score',
    dance: '💃 Dance',
    photo: '📸 Photo with Amira',
    again: '🔄 Play again',
    share: 'Save / share photo',
    back: 'Back',
    afterWin: 'Tap me to make me giggle, or take a photo with me! 📸',
  },
};
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const T = () => UI[lang];
const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const game = { target: -1, phase: 'idle', wave: 0, waveKey: null, need: 0, got: 0, hearts: 3, score: 0, combo: 0, lastHit: 0, bossHp: 0, spawnT: 0 };
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T()[el.dataset.i18n]; });
  if (game.waveKey) $('mission').textContent = T().waves[game.waveKey];
}
applyLang();
let bubbleTimer = 0;
function say(text, ms = 3200) {
  const b = $('bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}
const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch { /* not supported */ } };

// ---------- targets (order matches targets.mind) ----------
// height = target image height / width (MindAR makes the target 1 unit wide)
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

// Amira's clips: each starts and ends on the same pose as the still, so they chain
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
  filterMinCF: 0.0001, // steadier pose, a touch more lag
  filterBeta: 0.001,
  missTolerance: 15, // keep the world up through brief tracking dropouts
});
const { renderer, scene, camera } = mindar;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xfff6ee, 0x806070, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 1.7);
key.position.set(0.6, 1, 1);
scene.add(key);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = canvasTex(128, 128, (g, s) => {
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
});
// over a camera feed the canvas is transparent: add light without writing alpha
const GLOW = {
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
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

// ---------- the world (stage units: Amira is 1 tall) ----------
const stage = new THREE.Group(); // re-parented to whichever target is seen
const world = new THREE.Group(); // island + props, grows in
stage.add(world);

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
  // turquoise shallows fading out, plus a foam line
  const sea = new THREE.Mesh(new THREE.RingGeometry(0.56, 0.88, 96), new THREE.MeshBasicMaterial({
    map: canvasTex(256, 16, (c, w, h) => {
      const grd = c.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, 'rgba(90,220,225,0.95)');
      grd.addColorStop(1, 'rgba(40,160,210,0)');
      c.fillStyle = grd;
      c.fillRect(0, 0, w, h);
    }),
    transparent: true, depthWrite: false,
  }));
  const uv = sea.geometry.attributes.uv, sp = sea.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(sp.getX(i), sp.getY(i)) - 0.56) / 0.32, 0.5);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.005;
  g.add(sea);
  const foam = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.009, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
  foam.rotation.x = Math.PI / 2;
  g.add(foam);
  g.userData.foam = foam;
  return g;
})();
world.add(island);

const props = new THREE.Group();
world.add(props);
let cloudTemplate = null;
Promise.all([
  gltf.loadAsync(base('assets/models/palace.glb')),
  gltf.loadAsync(base('assets/models/palm.glb')),
  gltf.loadAsync(base('assets/models/cloud.glb')),
]).then(([palace, palm, cloud]) => {
  // everything stands behind or to the right of Amira, so nothing covers the pack
  const p = fit(palace.scene, 0.62);
  p.position.set(0.12, 0.02, -0.42);
  p.rotation.y = -0.35;
  props.add(p);
  for (const [x, z, h, ry] of [[0.5, -0.08, 0.95, 2.2], [0.42, 0.36, 0.55, -0.9]]) {
    const m = fit(palm.scene.clone(true), h);
    m.position.set(x, 0.02, z);
    m.rotation.y = ry;
    props.add(m);
  }
  cloudTemplate = cloud.scene;
});

// ---------- Amira: keyed cartoon billboard ----------
const KEY_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const KEY_FRAG = `
uniform sampler2D map; uniform float glow; uniform float flash; varying vec2 vUv;
void main(){
  vec4 c = texture2D(map, vUv);
  float g = c.g - max(c.r, c.b);
  float a = 1.0 - smoothstep(0.05, 0.16, g);   // green screen -> transparent
  // the source render has a soft grey floor shadow under her feet: drop neutral greys
  // there (her white gown is brighter, her shoes are pink, so both survive)
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  if (vUv.y < 0.14 && mx - mn < 0.09 && mx > 0.35 && mx < 0.8) a = 0.0;
  if (a < 0.03) discard;
  c.g = min(c.g, max(c.r, c.b) + 0.03);        // remove green spill on the edges
  vec3 col = c.rgb + glow * vec3(0.18, 0.14, 0.04) + flash * vec3(0.5, 0.2, 0.3);
  gl_FragColor = vec4(col, a);
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
  uniforms: { map: { value: stillTex }, glow: { value: 0 }, flash: { value: 0 } },
  vertexShader: KEY_VERT, fragmentShader: KEY_FRAG, transparent: true, side: THREE.DoubleSide, toneMapped: false,
});
// the frame is 9:16; she fills 74% of its height and stands 6% above its bottom edge
const FRAME_H = 1 / 0.74;
const amiraPlane = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_H * 9 / 16, FRAME_H), amiraMat);
amiraPlane.position.y = FRAME_H / 2 - 0.06 * FRAME_H;
const amira = new THREE.Group(); // billboard pivot at her feet
amira.add(amiraPlane);
amira.position.set(-0.18, 0.03, 0.14);
stage.add(amira);
// tap area roughly her shape (the frame's corners are empty)
const amiraHit = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8), new THREE.MeshBasicMaterial({ visible: false }));
amiraHit.position.y = 0.5;
amira.add(amiraHit);
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), new THREE.MeshBasicMaterial({
  map: canvasTex(128, 128, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(60,30,40,0.5)');
    grd.addColorStop(1, 'rgba(60,30,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  }),
  transparent: true, depthWrite: false,
}));
shadow.rotation.x = -Math.PI / 2;
shadow.scale.set(1.2, 0.7, 1);
shadow.position.set(-0.18, 0.065, 0.14);
stage.add(shadow);

let clip = null; // currently playing clip name
function playClip(name) {
  const v = videos[name];
  if (!v) return;
  if (clip && clip !== name) videos[clip].pause();
  clip = name;
  v.currentTime = 0;
  // switch to the clip only once it really has frames, so a slow or unsupported
  // video never shows up as a black box; she keeps her still pose meanwhile
  v.onplaying = () => { if (clip === name) amiraMat.uniforms.map.value = videoTex[name]; };
  v.onended = () => { if (clip === name) { clip = null; amiraMat.uniforms.map.value = stillTex; } };
  v.onerror = v.onended;
  v.play().catch(() => { if (clip === name) clip = null; });
}

// procedural moves on top of the clips (hop, shake, breathing) for snappy reactions
let move = null;
function doMove(type, dur) { move = { type, t: 0, dur }; }
const _cam = new THREE.Vector3();
function updateAmira(dt, time) {
  // face the camera, turning only around her vertical axis so she stays upright
  if (stage.parent) {
    stage.updateWorldMatrix(true, false);
    const camLocal = stage.worldToLocal(_cam.set(0, 0, 0));
    amira.rotation.y = Math.atan2(camLocal.x - amira.position.x, camLocal.z - amira.position.z);
  }
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
const sparkles = new Sparkles(1000);
const hearts = new Sparkles(240, heartTexture());
Object.assign(sparkles.points.material, GLOW);
Object.assign(hearts.points.material, GLOW);
stage.add(sparkles.points, hearts.points);

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
  stage.add(s);
  floaters.push({ s, t: 0 });
}

// ---------- tweens ----------
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }
const back = (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);

// ---------- game pieces ----------
const items = new THREE.Group();
stage.add(items);

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
    // a puffy 5-point star
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
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, ...GLOW, color: GLOW_COL[kind], opacity: kind === 'star' ? 1 : 0.7 }));
  glow.scale.setScalar(kind === 'star' ? 0.42 : 0.3);
  g.add(glow);
  // generous invisible hit sphere so small fingers always connect
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.item = g;
  g.add(hit);
  g.userData = { kind, behaviour, body, alive: true, counts: true, t: 0, seed: Math.random() * 10, a: rand(0, Math.PI * 2), r: rand(0.45, 0.85), h: rand(0.25, 1.15), speed: rand(0.5, 0.9) * (Math.random() < 0.5 ? 1 : -1) };
  if (behaviour === 'attack') {
    // start at the edge of the scene, then home in on her hair
    const a = rand(-1.3, 1.3) + (Math.random() < 0.5 ? 0 : Math.PI);
    g.position.set(Math.sin(a) * 1.1, rand(0.4, 1.3), Math.cos(a) * 0.9 + 0.3);
    g.userData.speed = rand(0.16, 0.24) + game.wave * 0.02;
  }
  g.scale.setScalar(0.01);
  items.add(g);
  return g;
}
const HEAD = new THREE.Vector3(-0.18, 0.82, 0.14);

// ---------- waves ----------
function setMission(k) {
  game.waveKey = k;
  const m = $('mission');
  m.hidden = false;
  m.textContent = T().waves[k];
  m.style.animation = 'none';
  void m.offsetWidth; // restart the pop-in animation
  m.style.animation = '';
}
function renderHud() {
  $('score-num').textContent = game.score;
  $('hearts').textContent = '❤️'.repeat(game.hearts) + '🤍'.repeat(3 - game.hearts);
  $('wave-fill').style.width = `${Math.min(100, (game.got / Math.max(1, game.need)) * 100)}%`;
  $('wave-num').textContent = `${game.wave}/3`;
}
function clearItems() { for (const c of [...items.children]) items.remove(c); }

function startGame() {
  clearItems();
  if (boss) { stage.remove(boss); boss = null; }
  Object.assign(game, { phase: 'play', wave: 0, score: 0, hearts: 3, combo: 0 });
  $('hud-game').hidden = false;
  $('btn-again').hidden = true;
  nextWave();
}
function nextWave() {
  game.wave++;
  game.got = 0;
  game.spawnT = 0;
  if (game.wave === 1) { game.need = 10; setMission(TARGETS[game.target].theme); }
  if (game.wave === 2) { game.need = 8; setMission('knots'); }
  if (game.wave === 3) { game.need = 14; game.bossHp = 14; setMission('boss'); spawnBoss(); }
  play('wave');
  renderHud();
}
function waveCleared() {
  if (game.phase !== 'play') return;
  clearItems();
  if (game.wave >= 3) return;
  play('combo');
  playClip('cheer');
  amiraMat.uniforms.glow.value = 1;
  say(pick(T().cleared), 2000);
  sparkles.burst(HEAD.clone(), [0xffd54f, 0xffffff, TARGETS[game.target].color], 120, { speed: 1.1, up: 0.4, life: 1.6 });
  game.phase = 'between';
  setTimeout(() => { if (game.phase === 'between') { game.phase = 'play'; nextWave(); } }, 2600);
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
  else if (u.counts && game.got % 4 === 0) say(pick(T().cheers), 1200);
}

function knotReachedHair(it) {
  it.userData.alive = false;
  items.remove(it);
  play('hurt');
  buzz(90);
  sparkles.burst(HEAD.clone(), [0x6b2fa8, 0xb06cff], 40, { speed: 0.6, life: 0.9 });
  amiraMat.uniforms.flash.value = 1;
  doMove('shake', 0.5);
  say(T().ouch, 1500);
  game.hearts = Math.max(0, game.hearts - 1);
  game.combo = 0;
  if (it.userData.counts) game.got++; // the wave still moves on, so nobody gets stuck
  renderHud();
  if (game.wave < 3 && game.got >= game.need) setTimeout(waveCleared, 400);
}

// boss
let boss = null;
function spawnBoss() {
  if (!cloudTemplate) return;
  boss = new THREE.Group();
  const m = fit(cloudTemplate.clone(true), 0.5);
  m.position.y -= 0.25;
  boss.add(m);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, ...GLOW, color: 0x9b4dff, opacity: 0.7 }));
  glow.scale.setScalar(1.1);
  boss.add(glow);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ visible: false }));
  boss.add(hit);
  boss.position.set(0, 2.4, 0.1);
  boss.userData = { t: 0, shot: 0, size: 1, hitT: 0 };
  stage.add(boss);
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
  renderHud();
  if (game.bossHp <= 0) defeatBoss();
}
function defeatBoss() {
  game.phase = 'finale';
  clearItems();
  playClip('magic');
  const b = boss;
  // golden magic stream from Amira to the cloud, then it bursts
  tween(1.6, (k) => {
    for (let n = 0; n < 6; n++) sparkles.emit(HEAD.clone().lerp(b.position, Math.random() * k), pick([0xffd54f, 0xff8fc8, 0xffffff]), { speed: 0.15, up: 0, life: 0.6 });
    b.rotation.z = Math.sin(k * 50) * 0.2;
  }, () => {
    play('win');
    buzz(150);
    sparkles.burst(b.position.clone(), [0xb06cff, 0xffd54f, 0xff8fc8, 0x7fe7ff, 0xffffff], 300, { speed: 1.8, up: 0.3, life: 2.2 });
    stage.remove(b);
    boss = null;
    game.score += 200;
    floatText('+200', b.position.clone(), '#ffd54f', 0.24);
    renderHud();
    setTimeout(win, 700);
  });
}

function win() {
  game.phase = 'won';
  const t = TARGETS[game.target];
  $('mission').hidden = true;
  playClip('cheer');
  amiraMat.uniforms.glow.value = 1;
  for (let n = 0; n < 5; n++) {
    setTimeout(() => {
      sparkles.burst(new THREE.Vector3(rand(-0.5, 0.5), 1.1, 0.1), [0xffd54f, 0xe8408f, 0x8a4fd8, 0x7fe7ff, 0xffffff, t.color], 140, { speed: 1.6, up: 0.6, life: 2.2 });
      hearts.burst(new THREE.Vector3(0, 0.9, 0.2), [0xff6fa5, 0xff9ec4, 0xf0628f], 14, { speed: 0.7, up: 0.5, life: 1.8 });
    }, n * 300);
  }
  const stars = Math.max(1, game.hearts);
  $('win-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  $('win-score').textContent = `${T().score}: ${game.score}`;
  $('win-line').textContent = t.product === null ? T().cardWin : STRINGS[lang].productLines[t.product];
  $('win').hidden = false;
  setTimeout(() => {
    $('win').hidden = true;
    say(T().afterWin, 5000);
    $('btn-again').hidden = false;
  }, 5000);
}

// ---------- which pack is it? ----------
// The three packs share the same artwork, so the tracker can't reliably tell them
// apart in greyscale. Read the label colour from the camera image instead.
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
  anchor.group.updateWorldMatrix(true, false); // the found callback fires before the next render
  camera.updateMatrixWorld();
  // circular mean of hue weighted by saturation over the pack-coloured areas
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

// ---------- placement ----------
// MindAR makes the target 1 unit wide. The island goes BESIDE the target so the
// label stays visible to the tracker, and Amira stands ~1.3x the bottle's height.
function placeFor(found, anchor) {
  const t = TARGETS[found];
  if (t.id !== 'card') return { pos: new THREE.Vector3(1.75, -t.height / 2, 0.55), rot: new THREE.Euler(0, -0.25, 0), S: t.height * 0.95 };
  anchor.group.updateMatrixWorld(true);
  const n = new THREE.Vector3(0, 0, 1).transformDirection(anchor.group.matrixWorld);
  const toCam = anchor.group.getWorldPosition(new THREE.Vector3()).negate().normalize();
  // card on a screen, facing the camera: island stands out in front of its lower half
  if (n.dot(toCam) > 0.82) return { pos: new THREE.Vector3(1.3, -t.height / 2, 0.5), rot: new THREE.Euler(0, -0.25, 0), S: 1.45 };
  // card lying on a table: the island sits on the card's far half
  return { pos: new THREE.Vector3(0, 0.2, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0), S: 1.3 };
}

// ---------- tracking events ----------
let ready = false;
let lastLost = { i: -1, at: 0 };
function onFound(found, anchor) {
  $('scan-hint').hidden = true;
  if (!ready) return;
  $('actions').hidden = false;
  const i = TARGETS[found].id === 'card' ? found : identifyPack(anchor, found);
  const { pos, rot, S } = placeFor(found, anchor);
  anchor.group.add(stage);
  stage.position.copy(pos);
  stage.rotation.copy(rot);
  stage.scale.setScalar(S);
  if (lastLost.i === i && performance.now() - lastLost.at < 6000 && game.target === i) {
    if (game.phase === 'play') $('mission').hidden = false;
    return;
  }
  // the island grows out of the table, palace and palms pop up, then Amira appears
  game.target = i;
  game.phase = 'intro';
  clearItems();
  if (boss) { stage.remove(boss); boss = null; }
  $('hud-game').hidden = true;
  $('mission').hidden = true;
  play('place');
  world.scale.setScalar(0.01);
  amira.visible = false;
  shadow.visible = false;
  props.children.forEach((p) => p.scale.setScalar(0.01));
  tween(0.8, (k) => world.scale.setScalar(Math.max(0.01, back(k))));
  props.children.forEach((p, n) => setTimeout(() => {
    play('tap');
    tween(0.5, (k) => p.scale.setScalar(Math.max(0.01, back(k))));
  }, 600 + n * 220));
  setTimeout(() => {
    amira.visible = true;
    shadow.visible = true;
    sparkles.burst(new THREE.Vector3(0, 0.5, 0.1), [TARGETS[i].color, 0xffd54f, 0xffffff], 160, { speed: 1.3, up: 0.4, life: 1.6 });
    play('win');
    doMove('hop', 0.5);
    playClip('wave');
    say(T().hello, 2600);
    setTimeout(() => { if (game.phase === 'intro') startGame(); }, 2600);
  }, 1500);
}
function onLost() {
  lastLost = { i: game.target, at: performance.now() };
  $('scan-hint').hidden = false;
  $('actions').hidden = true;
  $('mission').hidden = true;
}
TARGETS.forEach((_, i) => {
  const a = mindar.addAnchor(i);
  a.onTargetFound = () => onFound(i, a);
  a.onTargetLost = () => onLost(i);
});

// ---------- tapping ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
container.addEventListener('pointerdown', (e) => {
  if (!ready || !stage.parent || !stage.parent.visible) return;
  const r = container.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(items.children, true).find((h) => h.object.userData.item?.userData.alive);
  if (hit) { hitItem(hit.object.userData.item); return; }
  if (boss && raycaster.intersectObject(boss, true).length) { hitBoss(); return; }
  if (amira.visible && raycaster.intersectObject(amiraHit).length) tickle();
});
let tickleN = 0;
function tickle() {
  play('giggle');
  doMove('hop', 0.5);
  if (!clip) playClip(['wave', 'cheer', 'dance'][tickleN++ % 3]);
  hearts.burst(new THREE.Vector3(0, 0.85, 0.2), [0xff6fa5, 0xff9ec4, 0xf0628f], 16, { speed: 0.5, up: 0.4, life: 1.5 });
  say(pick(T().tickle), 2000);
}

// ---------- buttons ----------
$('btn-dance').onclick = () => {
  if (!ready) return;
  play('dance');
  playClip('dance');
  for (let n = 0; n < 10; n++) setTimeout(() => hearts.burst(new THREE.Vector3(rand(-0.4, 0.4), rand(0.4, 1.1), 0.2), [0xff6fa5, 0xff9ec4], 3, { speed: 0.3, up: 0.3, life: 1.4 }), n * 450);
};
$('btn-again').onclick = () => { if (game.target >= 0) startGame(); };

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
$('btn-sound').onclick = () => { sound.muted = !sound.muted; $('btn-sound').textContent = sound.muted ? '🔇' : '🔊'; };
$('btn-close').onclick = () => {
  mindar.stop();
  renderer.setAnimationLoop(null);
  $('hud').hidden = true;
  $('intro').hidden = false;
  $('btn-start').disabled = false;
};

// ---------- main loop ----------
const _v = new THREE.Vector3();
function frame(dt, time) {
  for (let k = tweens.length - 1; k >= 0; k--) {
    const tw = tweens[k];
    tw.t += dt;
    const p = Math.min(1, tw.t / tw.dur);
    tw.fn(p);
    if (p >= 1) { tweens.splice(k, 1); tw.done?.(); }
  }
  updateAmira(dt, time);
  island.userData.foam.scale.setScalar(1 + Math.sin(time * 1.4) * 0.015);

  // spawning
  if (game.phase === 'play') {
    game.spawnT += dt;
    const alive = items.children.filter((c) => c.userData.alive);
    if (game.wave === 1 && game.spawnT > 0.7 && alive.length < 4) {
      game.spawnT = 0;
      makeItem(Math.random() < 0.15 ? 'star' : TARGETS[game.target].theme, 'orbit');
    }
    if (game.wave === 2 && game.spawnT > 1.3 && alive.length < 3) { game.spawnT = 0; makeItem('knot', 'attack'); }
    if (game.wave === 3 && boss) {
      boss.userData.shot += dt;
      if (boss.userData.shot > 3 && alive.length < 2) {
        boss.userData.shot = 0;
        const k = makeItem('knot', 'attack');
        k.position.copy(boss.position);
        k.userData.counts = false; // boss knots hurt, but only boss hits finish the wave
      }
    }
  }
  // movement
  for (const it of items.children) {
    const u = it.userData;
    if (!u.alive) continue;
    u.t += dt;
    it.scale.setScalar(Math.min(1, u.t * 3));
    if (u.behaviour === 'orbit') {
      u.a += u.speed * dt;
      let h = u.h + Math.sin(time * 2 + u.seed) * 0.08;
      if (u.kind === 'bubbles') { u.h += dt * 0.07; if (u.h > 1.3) u.h = 0.25; h = u.h; }
      // sweeping figure-eight paths that swing toward the camera and back
      it.position.set(HEAD.x + Math.cos(u.a) * u.r, h, Math.sin(u.a * 2) * 0.35 + 0.25 + Math.sin(u.a) * 0.25);
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
  // boss drifting in
  if (boss) {
    const b = boss.userData;
    b.t += dt;
    boss.position.y += (1.3 - boss.position.y) * Math.min(1, dt * 1.5);
    boss.position.x = Math.sin(b.t * 0.8) * 0.45;
    b.hitT = Math.max(0, b.hitT - dt);
    boss.scale.setScalar(b.size * (1 + b.hitT * 0.6));
    boss.rotation.z = Math.sin(b.t * 2) * 0.08 + (b.hitT ? Math.sin(b.t * 60) * 0.15 : 0);
    if (Math.random() < 0.3) sparkles.emit(boss.position.clone().add(_v.set(rand(-0.25, 0.25), -0.2, 0)), 0x9b4dff, { speed: 0.1, up: -0.25, life: 1 });
  }
  // floating score text
  for (let k = floaters.length - 1; k >= 0; k--) {
    const f = floaters[k];
    f.t += dt;
    f.s.position.y += dt * 0.35;
    f.s.material.opacity = Math.max(0, 1 - f.t / 0.9);
    if (f.t > 0.9) { stage.remove(f.s); f.s.material.map.dispose(); floaters.splice(k, 1); }
  }
  // ambient sparkle around her while on screen
  if (stage.parent && amira.visible && Math.random() < 0.3) {
    sparkles.emit(new THREE.Vector3(rand(-0.3, 0.3), rand(0.1, 1.1), 0.12), pick([0xffe082, 0xfff6d6]), { speed: 0.07, up: 0.12, life: 1.2 });
  }
  const s = stage.matrixWorld.getMaxScaleOnAxis();
  sparkles.points.material.size = 0.05 * s;
  hearts.points.material.size = 0.09 * s;
  sparkles.update(dt);
  hearts.update(dt);
}

$('btn-start').onclick = async () => {
  unlockAudio();
  $('btn-start').disabled = true;
  // iOS only lets videos play after a tap: unlock every clip now
  for (const v of Object.values(videos)) v.play().then(() => v.pause()).catch(() => {});
  status.textContent = T().camera;
  try {
    await mindar.start();
    ready = true;
    $('intro').hidden = true;
    $('hud').hidden = false;
    $('scan-hint').hidden = false;
    status.textContent = '';
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
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
  window.amiraScan = { game, items, hitItem, hitBoss, tickle, camera, container, THREE, get boss() { return boss; } };
}
