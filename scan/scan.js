// Amira Magic Scan: point the camera at a Dabur Amla Kids pack (or the printable
// Amira card) and Princess Amira bursts out of it and comes to life.
// Image tracking runs in the browser (MindAR), so it works on iPhone and Android.
import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { character } from '../src/world.js';
import { Sparkles, play, sound, unlockAudio } from '../src/effects.js';
import { STRINGS } from '../src/i18n.js';

// ---------- copy ----------
const UI = {
  ar: {
    eyebrow: 'سحر دابر آملا كيدز',
    title: 'امسحي… وشاهدي أميرة تنبض بالحياة!',
    subtitle: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو إلى بطاقة أميرة، وستخرج الأميرة أميرة لتلعب معك ✨',
    start: '📷 افتحي الكاميرا',
    loading: 'جاري تحميل أميرة…',
    camera: 'جاري تشغيل الكاميرا…',
    cameraError: 'لم نتمكن من فتح الكاميرا. اسمحي بالوصول إلى الكاميرا ثم حاولي مجدداً.',
    scanHint: 'وجّهي الكاميرا إلى عبوة آملا كيدز أو بطاقة أميرة',
    wave: '👋 لوّحي',
    cheer: '🎉 احتفلي',
    magic: '✨ سحر',
    lang: 'English',
    cardLine: 'خرجتُ من البطاقة! هيا نلعب معاً 👑',
    hello: 'مرحباً! أنا الأميرة أميرة 👑',
  },
  en: {
    eyebrow: 'Dabur Amla Kids magic',
    title: 'Scan it… and watch Amira come to life!',
    subtitle: 'Point your camera at an Amla Kids pack or the Amira card, and Princess Amira jumps out to play ✨',
    start: '📷 Open camera',
    loading: 'Loading Amira…',
    camera: 'Starting camera…',
    cameraError: "We couldn't open the camera. Allow camera access, then try again.",
    scanHint: 'Point your camera at an Amla Kids pack or the Amira card',
    wave: '👋 Wave',
    cheer: '🎉 Cheer',
    magic: '✨ Magic',
    lang: 'العربية',
    cardLine: "I'm out of the card! Let's play together 👑",
    hello: "Hi! I'm Princess Amira 👑",
  },
};
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const T = () => UI[lang];
const $ = (id) => document.getElementById(id);
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T()[el.dataset.i18n]; });
}
applyLang();

let bubbleTimer = 0;
function say(text, ms = 4500) {
  const b = $('bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}

// ---------- targets (order matches targets.mind) ----------
// height = target image height / width (MindAR makes the target 1 unit wide)
const TARGETS = [
  { id: 'oil', height: 1024 / 495, color: 0xe0a33a, product: 0 },
  { id: 'detangler', height: 1024 / 441, color: 0xe8408f, product: 1 },
  { id: 'shampoo', height: 1024 / 479, color: 0x8a4fd8, product: 2 },
  { id: 'card', height: 1680 / 1200, color: 0xf6d68a, product: null },
];

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
]).then(([g, wave, cheer, cast]) => character(g, { wave: wave?.animations, cheer: cheer?.animations, cast: cast?.animations }, 1, { lockLegs: true, idleWeight: 0.35 }));

// ---------- AR ----------
const mindar = new MindARThree({
  container: $('ar'),
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

// soft contact shadow under her feet
const blob = new THREE.Mesh(
  new THREE.CircleGeometry(0.32, 40),
  new THREE.MeshBasicMaterial({
    map: (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, 'rgba(40,20,30,0.55)');
      grd.addColorStop(1, 'rgba(40,20,30,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true,
    depthWrite: false,
  }),
);
blob.rotation.x = -Math.PI / 2;
blob.position.y = 0.002;

const stage = new THREE.Group(); // Amira + shadow, re-parented to whichever target is seen
stage.add(blob);
const sparkles = new Sparkles(700);
// over a camera feed the canvas is transparent: add light without writing alpha,
// otherwise fading sparkles show up as dark specks
Object.assign(sparkles.points.material, {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
});
let amira = null;

const anchors = TARGETS.map((t, i) => {
  const a = mindar.addAnchor(i);
  a.onTargetFound = () => onFound(i, a);
  a.onTargetLost = () => onLost(i);
  return a;
});

// ---------- tweens ----------
const tweens = [];
const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });
const ease = (k) => 1 - Math.pow(1 - k, 3);

let current = -1;
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
      rot.set(0, 0, 0);
    } else {
      end.set(0, -0.15, 0.0);
      rot.set(Math.PI / 2, 0, 0);
    }
  }
  return { end, rot, size };
}

function onFound(i, anchor) {
  $('scan-hint').hidden = true;
  $('actions').hidden = !amira;
  if (!amira) return;
  const t = TARGETS[i];
  const { end, rot, size } = placeFor(i, anchor);
  anchor.group.add(stage);
  anchor.group.add(sparkles.points);
  stage.rotation.copy(rot);
  current = i;
  const quickReturn = lastLost.i === i && performance.now() - lastLost.at < 4000;
  if (quickReturn) {
    stage.position.copy(end);
    stage.scale.setScalar(size);
    return;
  }
  // she bursts out of the label and lands
  const start = new THREE.Vector3(0, 0, 0.05);
  play('place');
  amira.play('cheer');
  tween(1.3, (k) => {
    const e = ease(k);
    stage.position.lerpVectors(start, end, e);
    if (t.id !== 'card') stage.position.z += Math.sin(k * Math.PI) * 0.6;
    else stage.position.y += rot.x ? 0 : Math.sin(k * Math.PI) * 0.3;
    stage.scale.setScalar(Math.max(0.01, size * e));
    stage.rotation.y = rot.y + (1 - e) * Math.PI * 2;
    if (Math.random() < 0.7) sparkles.emit(stage.position.clone().add(_v.set(0, 0.5 * size * e, 0)), [t.color, 0xffffff, 0xffd54f][Math.floor(Math.random() * 3)], { speed: 0.6, up: 0.2, life: 1.2 });
  }, () => {
    sparkles.burst(stage.position.clone().add(_v.set(0, 0.6 * size, 0)), [t.color, 0xffd54f, 0xffffff], 90, { speed: 1.2, up: 0.4, life: 1.6 });
    play('win');
    amira.play('wave');
    const line = t.product === null ? T().cardLine : STRINGS[lang].productLines[t.product];
    say(`${T().hello} ${line}`, 6500);
  });
}

function onLost(i) {
  lastLost = { i, at: performance.now() };
  if (current === i) current = -1;
  $('scan-hint').hidden = false;
  $('actions').hidden = true;
}

// buttons
document.querySelectorAll('[data-act]').forEach((b) => {
  b.onclick = () => {
    if (!amira || current < 0) return;
    const act = b.dataset.act;
    amira.play(act);
    play(act === 'cast' ? 'grow' : 'collect');
    const size = stage.scale.x;
    const head = stage.position.clone().add(_v.set(0, 0.9 * size, 0));
    const col = TARGETS[current].color;
    sparkles.burst(head, [col, 0xffd54f, 0xffffff], act === 'cast' ? 160 : 60, { speed: act === 'cast' ? 1.4 : 0.8, up: 0.3, life: 1.4 });
    if (act === 'wave') say(STRINGS[lang].amiraLines[Math.floor(Math.random() * STRINGS[lang].amiraLines.length)]);
  };
});

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

$('btn-start').onclick = async () => {
  unlockAudio();
  $('btn-start').disabled = true;
  status.textContent = T().camera;
  try {
    const [a] = await Promise.all([amiraReady, mindar.start()]);
    if (!amira) {
      amira = a;
      stage.add(amira.group);
    }
    $('intro').hidden = true;
    $('hud').hidden = false;
    $('scan-hint').hidden = false;
    status.textContent = '';
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      for (let k = tweens.length - 1; k >= 0; k--) {
        const tw = tweens[k];
        tw.t += dt;
        const p = Math.min(1, tw.t / tw.dur);
        tw.fn(p);
        if (p >= 1) { tweens.splice(k, 1); tw.done?.(); }
      }
      amira.mixer.update(dt);
      // a gentle sparkle drift around her while she's on screen
      if (current >= 0 && Math.random() < 0.35) {
        const s = stage.scale.x;
        sparkles.emit(stage.position.clone().add(_v.set((Math.random() - 0.5) * 0.6 * s, Math.random() * 1.1 * s, (Math.random() - 0.5) * 0.3 * s)), [0xffe082, 0xfff6d6, TARGETS[current].color][Math.floor(Math.random() * 3)], { speed: 0.08, up: 0.12, life: 1.2 });
      }
      // point size is in world units; MindAR scales the anchor, so follow its scale
      const parent = sparkles.points.parent;
      if (parent) sparkles.points.material.size = 0.06 * parent.matrixWorld.getMaxScaleOnAxis();
      sparkles.update(dt);
      renderer.render(scene, camera);
    });
  } catch (err) {
    console.error(err);
    status.textContent = T().cameraError;
    $('btn-start').disabled = false;
  }
};
