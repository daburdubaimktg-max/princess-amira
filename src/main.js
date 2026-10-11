import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld } from './world.js';
import { Sparkles, play, sound, unlockAudio } from './effects.js';
import { STRINGS } from './i18n.js';

// ---------- i18n ----------
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const S = () => STRINGS[lang];
const $ = (id) => document.getElementById(id);

const SIZES = [0.3, 0.6, 1.0]; // tabletop, big, life-size (Amira ≈ 1 m tall)
let sizeIndex = 0;

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = S()[el.dataset.i18n]; });
  $('btn-size').textContent = `${S().size}: ${S().sizes[sizeIndex]}`;
}
applyLang();

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.xr.enabled = true;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 200);
camera.position.set(0.35, 1.15, 3.0);

const hemi = new THREE.HemisphereLight(0xdcefff, 0xe8c99a, 0.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
sun.position.set(2.2, 3.4, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -1.8;
sun.shadow.camera.right = sun.shadow.camera.top = 1.8;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 10;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 4;
scene.add(sun);
scene.add(sun.target);

const anchor = new THREE.Group();
anchor.visible = false;
scene.add(anchor);

const sparkles = new Sparkles(900);
scene.add(sparkles.points);

// shadow catcher so the island grounds itself on real tables in AR
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.35 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = -0.06;
shadowCatcher.receiveShadow = true;
shadowCatcher.visible = false;
anchor.add(shadowCatcher);

// ---------- loading ----------
let W = null;
let skyTex = null;
const pmrem = new THREE.PMREMGenerator(renderer);
const progress = { hdr: 0, models: 0 };
function showProgress() {
  const p = Math.round((progress.hdr * 0.25 + progress.models * 0.75) * 100);
  $('load-bar').style.width = `${p}%`;
  $('load-pct').textContent = `${p}%`;
}

const ready = (async () => {
  // Poly Haven "Kloofendal 43d Clear (Pure Sky)", CC0, tone-mapped equirect
  const hdrP = new THREE.TextureLoader().loadAsync(new URL('../assets/env/sky.jpg', import.meta.url).href, (e) => {
    if (e.total) { progress.hdr = e.loaded / e.total; showProgress(); }
  });
  const worldP = buildWorld({ renderer, onProgress: (k) => { progress.models = k; showProgress(); } });
  const [hdr, world] = await Promise.all([hdrP, worldP]);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  hdr.colorSpace = THREE.SRGBColorSpace;
  skyTex = hdr;
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = 1.15;
  W = world;
  anchor.add(W.world);
  anchor.visible = true;
  set3DBackdrop(true);
  progress.hdr = progress.models = 1;
  showProgress();
  $('loading').hidden = true;
  $('menu').hidden = false;
})().catch((err) => {
  console.error(err);
  $('load-pct').textContent = S().loadError;
});

function set3DBackdrop(on) {
  scene.background = on ? skyTex : null;
  scene.backgroundBlurriness = 0.0;
  scene.backgroundIntensity = 1.0;
  W?.setSeaVisible(on);
  shadowCatcher.visible = !on;
}

// ---------- orbit controls (3D mode + start-screen showcase) ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.55, 0);
controls.enableDamping = true;
controls.minDistance = 1.1;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI * 0.47;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;
controls.enabled = false;

function frameCamera() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  const dist = Math.max(3.0, 1.15 / Math.tan(halfH));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, dist);
  controls.maxDistance = Math.max(6, dist * 1.5);
}
frameCamera();

// ---------- game ----------
const game = { collected: 0, phase: 'intro', mode: null };
const tweens = [];
const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });

let bubbleTimer = 0;
function say(text, ms = 4200) {
  const b = $('bubble');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}

function renderProgress() {
  document.querySelectorAll('#progress .slot').forEach((el, i) => el.classList.toggle('got', i < game.collected));
}

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const S_ = () => anchor.scale.x; // effects scale with the world in AR

function collectBottle(b) {
  if (b.userData.collected || game.phase !== 'play') return;
  b.userData.collected = true;
  play('collect');
  say(S().bottleFound[b.userData.index]);
  sparkles.burst(b.getWorldPosition(_v), [b.userData.color, 0xffffff], 60, { speed: 0.5 * S_(), up: 0.2 * S_() });
  const from = b.position.clone();
  const to = new THREE.Vector3(0, 1.15, 0.15);
  tween(1.1, (k) => {
    const e = k * k * (3 - 2 * k);
    b.position.lerpVectors(from, to, e);
    b.position.y += Math.sin(k * Math.PI) * 0.3;
    b.rotation.y += 0.25;
    b.scale.setScalar(1 - e * 0.5);
  }, () => {
    b.visible = false;
    game.collected++;
    renderProgress();
    play('grow');
    W.amira.play(game.collected < 3 ? 'wave' : 'cheer');
    // magic pours over Amira's hair
    const head = W.amira.headWorld().clone();
    for (let n = 0; n < 140; n++) {
      const p = head.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.25, Math.random() * 0.1, -Math.random() * 0.15).multiplyScalar(S_()));
      sparkles.emit(p, n % 3 ? b.userData.color : 0xffe9a8, { speed: 0.15 * S_(), up: -0.25 * S_(), life: 1.6 });
    }
    if (game.collected === 3) setTimeout(finale, 2200);
  });
}

function finale() {
  game.phase = 'finale';
  say(S().allFound, 3400);
  const castDur = W.amira.play('cast') || 2;
  const cloud = W.cloud;
  tween(Math.max(1.6, castDur * 0.8), (k) => {
    const a = W.amira.headWorld().clone();
    a.y -= 0.25 * S_();
    const c = cloud.getWorldPosition(_w).clone();
    c.y += 0.15 * S_();
    for (let n = 0; n < 5; n++) {
      const p = a.clone().lerp(c, Math.random() * k);
      sparkles.emit(p, n % 2 ? 0xffd54f : 0xff8fc8, { speed: 0.12 * S_(), up: 0, life: 0.7 });
    }
    cloud.scale.setScalar(1 - k * 0.4);
    cloud.rotation.z = Math.sin(k * 40) * 0.15;
  }, () => {
    play('win');
    cloud.userData.defeated = true;
    sparkles.burst(cloud.getWorldPosition(_w), [0xb06cff, 0xffd54f, 0xff8fc8, 0x7fe7ff, 0xffffff], 260, { speed: 1.0 * S_(), up: 0.25 * S_(), life: 2.2 });
    cloud.visible = false;
    W.amira.play('cheer');
    W.friends.forEach((f) => f.play('cheer'));
    say(S().win, 7000);
    showLineup();
    game.phase = 'won';
    $('btn-replay').hidden = false;
  });
}

// the three real packs rise on a plinth in front of Amira: the brand moment
function showLineup() {
  const L = W.lineup;
  L.visible = true;
  tween(1.4, (k) => {
    const e = 1 - Math.pow(1 - k, 3);
    L.scale.setScalar(Math.max(0.001, e));
    L.position.y = (1 - e) * -0.1;
    L.rotation.y = (1 - e) * Math.PI;
  });
  setTimeout(() => sparkles.burst(L.getWorldPosition(_v).add(new THREE.Vector3(0, 0.2 * S_(), 0)), [0xffd54f, 0xe8408f, 0x8a4fd8, 0xffffff], 160, { speed: 0.6 * S_(), up: 0.3 * S_(), life: 1.8 }), 900);
}

function resetGame() {
  game.collected = 0;
  game.phase = 'play';
  W.bottles.forEach((b) => {
    b.userData.collected = false;
    b.visible = true;
    b.position.copy(b.userData.home);
    b.scale.setScalar(1);
  });
  W.lineup.visible = false;
  W.cloud.visible = true;
  W.cloud.scale.setScalar(1);
  W.cloud.userData.defeated = false;
  renderProgress();
  $('btn-replay').hidden = true;
  say(S().intro, 6500);
  W.amira.play('wave');
}

function onTapObject(obj) {
  let o = obj;
  while (o && !o.userData.kind) o = o.parent;
  if (!o) return false;
  const k = o.userData.kind;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  if (k === 'bottle') collectBottle(o);
  else if (k === 'amira') {
    play('tap');
    W.amira.play(Math.random() < 0.5 ? 'wave' : 'cheer');
    say(game.phase === 'won' ? S().win : pick(S().amiraLines));
    sparkles.burst(W.amira.headWorld(), [0xffd54f, 0xff8fc8], 40, { speed: 0.4 * S_(), up: 0.2 * S_() });
  } else if (k === 'friend') {
    play('tap');
    W.friends[o.userData.index].play('cheer');
    say(pick(S().friendLines));
  } else if (k === 'cloud') {
    play('cloud');
    say(pick(S().cloudLines));
    sparkles.burst(o.getWorldPosition(_v), 0xb06cff, 40, { speed: 0.4 * S_() });
  } else if (k === 'product') {
    play('tap');
    say(S().productLines[o.userData.index ?? Math.floor(Math.random() * 3)], 4000);
  } else if (k === 'ball') {
    play('tap');
    say(S().ball, 1500);
    tween(0.8, (t) => { o.position.y = 0.07 + Math.sin(t * Math.PI) * 0.3; o.rotation.x += 0.2; });
  } else return false;
  return true;
}

const raycaster = new THREE.Raycaster();
function pickFrom(origin, dir) {
  if (!W) return false;
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObject(W.world, true).filter((h) => h.object.visible && h.object.name !== 'sea' && h.object.name !== 'lagoon');
  for (const h of hits) if (onTapObject(h.object)) return true;
  return false;
}

// ---------- 3D mode ----------
function start3D() {
  game.mode = '3d';
  $('start').hidden = true;
  $('hud').hidden = false;
  $('btn-size').hidden = true;
  $('btn-exit').hidden = true;
  set3DBackdrop(true);
  anchor.position.set(0, 0, 0);
  anchor.rotation.set(0, 0, 0);
  anchor.scale.setScalar(1);
  controls.enabled = true;
  controls.autoRotate = false;
  resetGame();
}

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (game.mode !== '3d' || !downAt) return;
  if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return; // was a drag
  const r = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  pickFrom(raycaster.ray.origin.clone(), raycaster.ray.direction.clone());
});

// ---------- AR mode (WebXR hit-test) ----------
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.07, 0.09, 40).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffd54f }),
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

let hitTestSource = null;
let placed = false;
const controller = renderer.xr.getController(0);
scene.add(controller);

controller.addEventListener('select', () => {
  if (game.mode !== 'ar') return;
  if (!placed) { if (reticle.visible) placeWorld(); return; }
  const m = new THREE.Matrix4().extractRotation(controller.matrixWorld);
  pickFrom(new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld), new THREE.Vector3(0, 0, -1).applyMatrix4(m));
});

function placeWorld() {
  const p = new THREE.Vector3();
  reticle.matrix.decompose(p, new THREE.Quaternion(), new THREE.Vector3());
  anchor.position.copy(p);
  const cp = new THREE.Vector3().setFromMatrixPosition(renderer.xr.getCamera().matrixWorld);
  anchor.rotation.set(0, Math.atan2(cp.x - p.x, cp.z - p.z), 0);
  anchor.scale.setScalar(SIZES[sizeIndex]);
  anchor.visible = true;
  placed = true;
  reticle.visible = false;
  $('ar-hint').hidden = true;
  play('place');
  sparkles.burst(p.clone().add(new THREE.Vector3(0, 0.1, 0)), [0xffd54f, 0xff8fc8, 0xffffff], 140, { speed: 0.5, up: 0.3 });
  resetGame();
}

async function startAR() {
  unlockAudio();
  try {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: { root: $('overlay') },
    });
    game.mode = 'ar';
    set3DBackdrop(false);
    controls.enabled = false;
    anchor.visible = false;
    placed = false;
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(session);
    hitTestSource = await session.requestHitTestSource({ space: await session.requestReferenceSpace('viewer') });
    $('start').hidden = true;
    $('hud').hidden = false;
    $('btn-size').hidden = false;
    $('btn-exit').hidden = false;
    $('ar-hint').hidden = false;
    session.addEventListener('end', () => {
      hitTestSource = null;
      game.mode = null;
      $('hud').hidden = true;
      $('ar-hint').hidden = true;
      $('start').hidden = false;
      anchor.position.set(0, 0, 0);
      anchor.rotation.set(0, 0, 0);
      anchor.scale.setScalar(1);
      anchor.visible = true;
      set3DBackdrop(true);
      controls.autoRotate = true;
    });
  } catch (err) {
    console.error(err);
    $('ar-note').hidden = false;
  }
}

$('overlay').addEventListener('beforexrselect', (e) => { if (e.target.closest('button')) e.preventDefault(); });

// ---------- UI wiring ----------
$('btn-ar').onclick = startAR;
$('btn-3d').onclick = async () => { unlockAudio(); await ready; if (W) start3D(); };
$('btn-lang').onclick = () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('amira-lang', lang); } catch { /* ignore */ }
  applyLang();
};
$('btn-size').onclick = () => {
  sizeIndex = (sizeIndex + 1) % SIZES.length;
  applyLang();
  if (placed) {
    const from = anchor.scale.x, to = SIZES[sizeIndex];
    tween(0.5, (k) => anchor.scale.setScalar(from + (to - from) * k));
  }
};
$('btn-replay').onclick = resetGame;
$('btn-sound').onclick = () => {
  sound.muted = !sound.muted;
  $('btn-sound').textContent = sound.muted ? '🔇' : '🔊';
};
$('btn-exit').onclick = () => renderer.xr.getSession()?.end();
$('btn-home').onclick = () => {
  if (renderer.xr.isPresenting) { renderer.xr.getSession().end(); return; }
  game.mode = null;
  controls.enabled = false;
  controls.autoRotate = true;
  $('hud').hidden = true;
  $('start').hidden = false;
};

if (navigator.xr?.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-ar')
    .then((ok) => { $('btn-ar').hidden = !ok; $('ar-note').hidden = ok; })
    .catch(() => { $('ar-note').hidden = false; });
} else {
  $('btn-ar').hidden = true;
  $('ar-note').hidden = false;
}

window.addEventListener('resize', () => {
  frameCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- main loop ----------
const clock = new THREE.Clock();
let ambientT = 0;
renderer.setAnimationLoop((_, frame) => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (frame && hitTestSource && !placed) {
    const hits = frame.getHitTestResults(hitTestSource);
    if (hits.length) {
      reticle.visible = true;
      reticle.matrix.fromArray(hits[0].getPose(renderer.xr.getReferenceSpace()).transform.matrix);
    } else reticle.visible = false;
  }

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.done?.(); }
  }

  if (W && anchor.visible) {
    W.update(t, dt);
    ambientT += dt;
    if (ambientT > 0.09) {
      ambientT = 0;
      const s = S_();
      // Amira's hair shimmer grows with each bottle collected
      const shimmer = 1 + game.collected * 2;
      for (let n = 0; n < shimmer; n++) {
        const h = W.amira.headWorld().clone();
        h.add(new THREE.Vector3((Math.random() - 0.5) * 0.3, -Math.random() * 0.5, -0.08 - Math.random() * 0.06).multiplyScalar(s));
        sparkles.emit(h, n % 2 ? 0xffe082 : 0xfff6d6, { speed: 0.05 * s, up: 0.04 * s, life: 1.2 });
      }
      for (const b of W.bottles) if (b.visible && !b.userData.collected) {
        sparkles.emit(b.getWorldPosition(_v).add(new THREE.Vector3(0, 0.1 * s, 0)), b.userData.color, { speed: 0.12 * s, up: 0.06 * s, life: 1 });
      }
      if (W.cloud.visible) sparkles.emit(W.cloud.getWorldPosition(_v), 0x9b4dff, { speed: 0.12 * s, up: -0.1 * s, life: 1.2 });
    }
  }
  sparkles.points.material.size = 0.04 * (game.mode === 'ar' ? anchor.scale.x * 1.4 : 1);
  sparkles.update(dt);

  if (!renderer.xr.isPresenting) controls.update();
  renderer.render(scene, camera);
});

// handy for automated screenshots: open with ?debug
if (new URLSearchParams(location.search).has('debug')) {
  window.amiraDebug = { get W() { return W; }, camera, controls, collectBottle, game, ready, start3D };
}
