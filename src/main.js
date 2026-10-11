import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWorld } from './world.js';
import { Sparkles, play, sound, unlockAudio } from './effects.js';
import { STRINGS } from './i18n.js';

// ---------- i18n ----------
let lang = 'ar';
try { lang = localStorage.getItem('amira-lang') || 'ar'; } catch { /* storage blocked */ }
const S = () => STRINGS[lang];
const $ = (id) => document.getElementById(id);

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = S()[el.dataset.i18n]; });
  $('btn-size').textContent = `${S().size}: ${S().sizes[sizeIndex]}`;
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.xr.enabled = true;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50);
camera.position.set(0, 1.25, 2.7);

scene.add(new THREE.HemisphereLight(0xfff4e8, 0x7a6a8a, 0.9));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(1.5, 3, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = sun.shadow.camera.bottom = -2;
sun.shadow.camera.right = sun.shadow.camera.top = 2;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(sun.target);

// "anchor" holds the world; in AR it's moved to the tapped surface
const anchor = new THREE.Group();
scene.add(anchor);
const W = buildWorld();
anchor.add(W.world);

// shadow catcher so the island grounds itself on real tables in AR
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.3 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = -0.1;
shadowCatcher.receiveShadow = true;
W.world.add(shadowCatcher);

const sparkles = new Sparkles(800);
scene.add(sparkles.points);

// 3D-mode-only backdrop: sky gradient + ocean
const sky = (() => {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#7ec8f2');
  grd.addColorStop(0.55, '#ffd7e8');
  grd.addColorStop(1, '#ffe9c7');
  g.fillStyle = grd;
  g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const ocean = new THREE.Mesh(new THREE.CircleGeometry(20, 64), new THREE.MeshStandardMaterial({ color: 0x48b9d4, roughness: 0.2, metalness: 0.1 }));
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -0.045;
ocean.receiveShadow = true;

function set3DBackdrop(on) {
  scene.background = on ? sky : null;
  scene.fog = on ? new THREE.Fog(0xffe2ec, 6, 18) : null;
  if (on) W.world.add(ocean); else W.world.remove(ocean);
  shadowCatcher.visible = !on;
}

// ---------- orbit controls (3D mode) ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0);
controls.enableDamping = true;
controls.minDistance = 0.8;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.4;
controls.enabled = false;

// ---------- sizing ----------
const SIZES = [0.3, 0.6, 1.0]; // tabletop, big, life-size (Amira ≈ 1m tall)
let sizeIndex = 0;

// ---------- game state ----------
const game = { collected: 0, phase: 'intro', mode: null };
const tweens = [];
function tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }

let bubbleTimer = 0;
function say(text, ms = 3800) {
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

function collectBottle(b) {
  if (b.userData.collected || game.phase === 'finale') return;
  b.userData.collected = true;
  play('collect');
  const i = b.userData.index;
  say(S().bottleFound[i]);
  sparkles.burst(b.getWorldPosition(_v), [b.userData.color, 0xffffff], 50, { speed: 0.5 * anchor.scale.x, up: 0.2 * anchor.scale.x });
  const from = b.position.clone();
  const to = new THREE.Vector3(0, 1.05, 0.12);
  tween(1.0, (k) => {
    const e = k * k * (3 - 2 * k);
    b.position.lerpVectors(from, to, e);
    b.position.y += Math.sin(k * Math.PI) * 0.3;
    b.rotation.y += 0.3;
    b.scale.setScalar(1.15 * (1 - e * 0.6));
  }, () => {
    // pour magic onto Amira's hair
    b.visible = false;
    game.collected++;
    renderProgress();
    W.amira.setHairLevel(game.collected);
    W.amira.twirl();
    play('grow');
    const s = anchor.scale.x;
    sparkles.burst(W.amira.headWorld(), [0xffd54f, b.userData.color, 0xffffff], 90, { speed: 0.7 * s, up: 0.1 * s });
    if (game.collected === 3) setTimeout(finale, 1500);
  });
}

function finale() {
  game.phase = 'finale';
  say(S().allFound, 3200);
  W.amira.cast();
  const cloud = W.cloud;
  const s = anchor.scale.x;
  // golden hair-magic stream from Amira to the cloud
  tween(1.6, (k) => {
    const a = W.amira.headWorld().clone();
    const c = cloud.getWorldPosition(_w);
    for (let n = 0; n < 4; n++) {
      const p = a.clone().lerp(c, Math.random() * k);
      sparkles.emit(p, n % 2 ? 0xffd54f : 0xff8fc8, { speed: 0.15 * s, up: 0, life: 0.6 });
    }
    cloud.scale.setScalar(1 - k * 0.35);
    cloud.rotation.z = Math.sin(k * 40) * 0.15;
  }, () => {
    play('win');
    cloud.userData.defeated = true;
    sparkles.burst(cloud.getWorldPosition(_w), [0xb06cff, 0xffd54f, 0xff8fc8, 0x7fe7ff, 0xffffff], 200, { speed: 1.0 * s, up: 0.2 * s, life: 2 });
    cloud.visible = false;
    W.amira.cheer();
    W.friends.forEach((f) => f.cheer());
    say(S().win, 6000);
    game.phase = 'won';
    $('btn-replay').hidden = false;
  });
}

function resetGame() {
  game.collected = 0;
  game.phase = 'play';
  W.bottles.forEach((b) => {
    b.userData.collected = false;
    b.visible = true;
    b.position.copy(b.userData.home);
    b.scale.setScalar(1.15);
  });
  W.cloud.visible = true;
  W.cloud.scale.setScalar(1);
  W.cloud.userData.defeated = false;
  W.amira.setHairLevel(0);
  renderProgress();
  $('btn-replay').hidden = true;
  say(S().intro, 6000);
  W.amira.wave();
}

function onTapObject(obj) {
  let o = obj;
  while (o && !o.userData.kind) o = o.parent;
  if (!o) return false;
  const k = o.userData.kind;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const s = anchor.scale.x;
  if (k === 'bottle') collectBottle(o);
  else if (k === 'amira') {
    play('tap');
    if (!W.amira.busy) (Math.random() < 0.5 ? W.amira.twirl : W.amira.wave)();
    say(game.phase === 'won' ? S().win : pick(S().amiraLines));
    sparkles.burst(W.amira.headWorld(), [0xffd54f, 0xff8fc8], 30, { speed: 0.4 * s, up: 0.2 * s });
  } else if (k === 'friend') {
    play('tap');
    W.friends[o.userData.index].wave();
    say(pick(S().friendLines));
  } else if (k === 'cloud') {
    play('cloud');
    say(pick(S().cloudLines));
    sparkles.burst(o.getWorldPosition(_v), 0xb06cff, 30, { speed: 0.4 * s });
  } else if (k === 'ball') {
    play('tap');
    say(S().ball, 1500);
    const b = o;
    tween(0.8, (t) => { b.position.y = 0.06 + Math.sin(t * Math.PI) * 0.25; b.rotation.x += 0.2; });
  } else return false;
  return true;
}

const raycaster = new THREE.Raycaster();
function pickFrom(origin, dir) {
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObject(W.world, true).filter((h) => h.object.visible && h.object !== shadowCatcher && h.object !== ocean);
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
  anchor.visible = true;
  anchor.scale.setScalar(1);
  controls.enabled = true;
  resetGame();
}

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (game.mode !== '3d' || !downAt) return;
  if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return; // was a drag
  const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  pickFrom(raycaster.ray.origin, raycaster.ray.direction);
  controls.autoRotate = false;
});

// ---------- AR mode (WebXR hit-test) ----------
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.06, 0.08, 32).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xffd54f }),
);
const reticleCrown = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 5), new THREE.MeshBasicMaterial({ color: 0xff8fc8 }));
reticleCrown.position.y = 0.03;
reticle.add(reticleCrown);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add(reticle);

let hitTestSource = null;
let placed = false;
const controller = renderer.xr.getController(0);
scene.add(controller);

controller.addEventListener('select', () => {
  if (game.mode !== 'ar') return;
  if (!placed) {
    if (!reticle.visible) return;
    placeWorld();
    return;
  }
  const m = new THREE.Matrix4().extractRotation(controller.matrixWorld);
  const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
  const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(m);
  pickFrom(origin, dir);
});

function placeWorld() {
  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  reticle.matrix.decompose(p, q, sc);
  anchor.position.copy(p);
  const cam = renderer.xr.getCamera();
  const cp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  anchor.rotation.set(0, Math.atan2(cp.x - p.x, cp.z - p.z), 0);
  anchor.scale.setScalar(SIZES[sizeIndex]);
  anchor.visible = true;
  placed = true;
  reticle.visible = false;
  $('ar-hint').hidden = true;
  play('place');
  sparkles.burst(p.clone().add(new THREE.Vector3(0, 0.1, 0)), [0xffd54f, 0xff8fc8, 0xffffff], 120, { speed: 0.5, up: 0.3 });
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
    const viewer = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource({ space: viewer });
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
    });
  } catch (err) {
    console.error(err);
    $('ar-note').hidden = false;
  }
}

// taps on HUD buttons shouldn't also count as AR "select" taps
$('overlay').addEventListener('beforexrselect', (e) => {
  if (e.target.closest('button')) e.preventDefault();
});

// ---------- UI wiring ----------
$('btn-ar').onclick = startAR;
$('btn-3d').onclick = () => { unlockAudio(); start3D(); };
$('btn-lang').onclick = () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem('amira-lang', lang); } catch { /* ignore */ }
  applyLang();
};
$('btn-size').onclick = () => {
  sizeIndex = (sizeIndex + 1) % SIZES.length;
  applyLang();
  if (placed) {
    const from = anchor.scale.x;
    const to = SIZES[sizeIndex];
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
  $('hud').hidden = true;
  $('start').hidden = false;
};

if (navigator.xr?.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-ar').then((ok) => {
    $('btn-ar').hidden = !ok;
    $('ar-note').hidden = ok;
  }).catch(() => { $('ar-note').hidden = false; });
} else {
  $('btn-ar').hidden = true;
  $('ar-note').hidden = false;
}

// keep the whole island in frame on tall phone screens too
function frameCamera() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  const dist = Math.max(2.7, 1.0 / Math.tan(halfH));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).addScaledVector(dir, dist);
  controls.maxDistance = Math.max(5, dist * 1.4);
}
frameCamera();
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
      const pose = hits[0].getPose(renderer.xr.getReferenceSpace());
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
      reticleCrown.rotation.y = t * 2;
    } else reticle.visible = false;
  }

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.done?.(); }
  }

  if (anchor.visible) {
    W.update(t, dt);
    // ambient sparkles drifting off Amira's hair + the glowing bottles
    ambientT += dt;
    if (ambientT > 0.08) {
      ambientT = 0;
      const s = anchor.scale.x;
      sparkles.emit(W.amira.hairTipWorld(), 0xffe082, { speed: 0.08 * s, up: 0.05 * s, life: 1.4 });
      for (const b of W.bottles) if (b.visible && !b.userData.collected) {
        sparkles.emit(b.getWorldPosition(_v), b.userData.color, { speed: 0.12 * s, up: 0.06 * s, life: 1 });
      }
      if (W.cloud.visible) sparkles.emit(W.cloud.getWorldPosition(_v), 0x9b4dff, { speed: 0.1 * s, up: -0.1 * s, life: 1.2 });
    }
  }
  sparkles.points.material.size = 0.045 * (game.mode === 'ar' ? anchor.scale.x * 1.4 : 1);
  sparkles.update(dt);

  if (controls.enabled) controls.update();
  renderer.render(scene, camera);
});

applyLang();

// handy for automated screenshots: open with ?debug
if (new URLSearchParams(location.search).has('debug')) {
  window.amiraDebug = { W, camera, controls, collectBottle, game };
}
