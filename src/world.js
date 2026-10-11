// Amira's palace-beach island: loads the production GLB assets (characters are
// rigged + animated) and builds the ground, sea and props around them.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Water } from 'three/addons/objects/Water.js';
import { loadProducts, PRODUCTS } from './products.js';

const BASE = new URL('../assets/', import.meta.url);
const url = (p) => new URL(p, BASE).href;

export const BOTTLE_COLORS = PRODUCTS.map((p) => p.color);

// ---------- helpers ----------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
  });
  return _glow;
}

/** Scale a loaded model to `height`, put its feet on y=0 and centre it on x/z. */
function fit(obj, height) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj, true); // precise: respects skinning
  const size = box.getSize(new THREE.Vector3());
  const s = height / size.y;
  obj.scale.multiplyScalar(s);
  obj.updateMatrixWorld(true);
  box.setFromObject(obj, true);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y;
  const holder = new THREE.Group();
  holder.add(obj);
  return holder;
}

function prep(root, { cast = true, receive = true } = {}) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = cast;
    o.receiveShadow = receive;
    o.frustumCulled = false; // skinned meshes animate outside their bind-pose bounds
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.map) m.map.anisotropy = 4;
      // generated PBR maps tend to read as metallic; keep fabric/skin soft
      if (m.metalness !== undefined) m.metalness = Math.min(m.metalness, 0.35);
      m.envMapIntensity = 0.9;
    }
  });
  return root;
}

// ---------- animated character ----------
// Auto-rigged ball gowns tear when the legs move, so leg/hip tracks can be dropped
// and the body animates from the waist up.
const LEG_BONES = /(UpLeg|Leg|Foot|Toe|Hips)$/;
export function character(gltf, extraClips, height, { lockLegs = false, idleWeight = 0.5 } = {}) {
  const model = prep(gltf.scene);
  const holder = fit(model, height);
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  const add = (name, clip) => {
    if (!clip) return;
    const c = clip.clone();
    if (lockLegs) c.tracks = c.tracks.filter((t) => !LEG_BONES.test(t.name.split('.')[0]));
    const a = mixer.clipAction(c);
    // idle is blended with the rest pose so the stock clip reads as gentle breathing
    a.setEffectiveWeight(name === 'idle' ? idleWeight : 1);
    actions[name] = a;
  };
  add('idle', gltf.animations[0]);
  for (const [name, clips] of Object.entries(extraClips)) add(name, clips?.[0]);
  let current = actions.idle;
  current?.play();

  function play(name, { fade = 0.3, once = true } = {}) {
    const next = actions[name];
    if (!next) return 0;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.enabled = true;
    if (current && current !== next) current.crossFadeTo(next, fade, false);
    next.play();
    current = next;
    if (once && actions.idle) {
      const dur = next.getClip().duration;
      clearTimeout(holder.userData.backToIdle);
      holder.userData.backToIdle = setTimeout(() => play('idle', { once: false }), dur * 1000 - fade * 1000);
      return dur;
    }
    return 0;
  }

  const head = new THREE.Vector3();
  return {
    group: holder,
    model,
    mixer,
    play,
    has: (n) => !!actions[n],
    headWorld() {
      holder.updateMatrixWorld(true);
      head.set(0, height * 0.82, 0);
      return holder.localToWorld(head);
    },
  };
}

// ---------- ground: organic sand island ----------
function island(tl) {
  const tex = (n, srgb) => {
    const t = tl.load(url(`tex/${n}`));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 3);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const geo = new THREE.CircleGeometry(1.3, 160, 0, Math.PI * 2);
  // lift into a soft dune and wobble the shoreline
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.y);
    const a = Math.atan2(v.y, v.x);
    const wob = 1 + 0.07 * Math.sin(a * 3 + 0.5) + 0.04 * Math.sin(a * 7 + 1.3) + 0.02 * Math.sin(a * 13);
    const k = r / 1.3;
    v.x *= wob;
    v.y *= wob;
    v.z = 0.09 * Math.pow(Math.max(0, 1 - k * k), 1.5) - 0.06 * Math.pow(k, 6);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    map: tex('aerial_beach_01_diff.jpg', true),
    normalMap: tex('aerial_beach_01_nor_gl.jpg'),
    roughnessMap: tex('aerial_beach_01_rough.jpg'),
    color: 0xffe2b0, // warm the grey scan to golden Gulf sand
    roughness: 1,
    normalScale: new THREE.Vector2(0.8, 0.8),
  });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.name = 'sand';
  return m;
}

function shoreFoam() {
  const tex = canvasTex(512, 32, (c, w, h) => {
    for (let i = 0; i < 260; i++) {
      c.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.5})`;
      c.beginPath();
      c.ellipse(Math.random() * w, h / 2 + (Math.random() - 0.5) * h * 0.6, 2 + Math.random() * 6, 1 + Math.random() * 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.24, 1.42, 128, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false }),
  );
  // map the strip texture around the ring
  const uv = ring.geometry.attributes.uv;
  const p = ring.geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const a = Math.atan2(p.getY(i), p.getX(i));
    const r = Math.hypot(p.getX(i), p.getY(i));
    uv.setXY(i, (a / (Math.PI * 2) + 0.5), (r - 1.24) / 0.18);
  }
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.035;
  return ring;
}

function picnic() {
  const g = new THREE.Group();
  const cloth = canvasTex(256, 256, (c, w) => {
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      c.fillStyle = (i + j) % 2 ? '#e98cb0' : '#f7f0f4';
      c.fillRect(i * s, j * s, s, s);
    }
    c.globalAlpha = 0.15;
    for (let k = 0; k < 4000; k++) { c.fillStyle = k % 2 ? '#000' : '#fff'; c.fillRect(Math.random() * w, Math.random() * w, 1, 1); }
  });
  const blanketGeo = new THREE.PlaneGeometry(0.55, 0.42, 20, 16);
  const bp = blanketGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) bp.setZ(i, Math.sin(bp.getX(i) * 18) * 0.004 + Math.cos(bp.getY(i) * 15) * 0.003);
  blanketGeo.computeVertexNormals();
  const blanket = new THREE.Mesh(blanketGeo, new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.95 }));
  blanket.rotation.x = -Math.PI / 2;
  blanket.position.y = 0.012;
  blanket.receiveShadow = true;
  g.add(blanket);
  const wicker = new THREE.MeshStandardMaterial({ color: 0xa8743c, roughness: 0.9 });
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.056, 0.06, 24), wicker);
  basket.position.set(0.1, 0.045, -0.05);
  basket.castShadow = true;
  g.add(basket);
  [0x8bc34a, 0xa5d063, 0xd93636, 0xffb300, 0x7cb342, 0x8bc34a].forEach((c, i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.35 }));
    f.position.set(0.1 + Math.cos(i * 1.1) * 0.035, 0.085, -0.05 + Math.sin(i * 1.1) * 0.035);
    f.castShadow = true;
    g.add(f);
  });
  return g;
}

function beachBall() {
  const tex = canvasTex(256, 128, (c, w, h) => {
    ['#e53935', '#ffffff', '#1e88e5', '#ffffff', '#fdd835', '#ffffff'].forEach((col, i, a) => {
      c.fillStyle = col;
      c.fillRect((i * w) / a.length, 0, w / a.length + 1, h);
    });
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 20), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.25, clearcoat: 1 }));
  ball.castShadow = true;
  return ball;
}

// ---------- build ----------
export async function buildWorld({ renderer, onProgress }) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, done, total) => onProgress?.(done / total);
  const gl = new GLTFLoader(manager);
  const tl = new THREE.TextureLoader(manager);
  const load = (f) => gl.loadAsync(url(`models/${f}`));
  const loadOpt = (f) => load(f).catch(() => null);
  const clipsOf = (g) => g?.animations;

  const [amiraG, wave, cheer, cast, f1G, f2G, f1Cheer, f2Cheer, palaceG, palmG, cloudG, packs, lineupPacks] = await Promise.all([
    load('amira.glb'), loadOpt('amira_wave.glb'), loadOpt('amira_cheer.glb'), loadOpt('amira_cast.glb'),
    load('friend_blue.glb'), load('friend_pony.glb'), loadOpt('friend_blue_cheer.glb'), loadOpt('friend_pony_cheer.glb'),
    load('palace.glb'), load('palm.glb'), load('cloud.glb'),
    loadProducts(BASE, manager, 0.26), loadProducts(BASE, manager, 0.4),
  ]);

  const world = new THREE.Group();
  world.name = 'AmiraWorld';

  // sand, shoreline, and a sea that only shows in 3D mode (hidden in AR)
  const sand = island(tl);
  world.add(sand);
  world.add(shoreFoam());

  const waterNormals = tl.load(url('tex/waternormals.jpg'), (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const sea = new Water(new THREE.CircleGeometry(40, 64), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals,
    sunDirection: new THREE.Vector3(0.5, 0.7, 0.3).normalize(),
    sunColor: 0xfff4e0,
    waterColor: 0x0f6e8c,
    distortionScale: 1.6,
    size: 6,
    fog: false,
  });
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.04;
  sea.name = 'sea';
  // shallow turquoise lagoon tint near the island
  const lagoon = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 96),
    new THREE.MeshBasicMaterial({
      map: canvasTex(256, 256, (c, w) => {
        const g = c.createRadialGradient(w / 2, w / 2, w * 0.18, w / 2, w / 2, w / 2);
        g.addColorStop(0, 'rgba(110,232,224,0.85)');
        g.addColorStop(0.55, 'rgba(60,200,210,0.45)');
        g.addColorStop(1, 'rgba(40,160,200,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, w);
      }),
      transparent: true,
      depthWrite: false,
    }),
  );
  lagoon.rotation.x = -Math.PI / 2;
  lagoon.position.y = -0.038;
  lagoon.name = 'lagoon';

  // palace behind the characters
  const palace = fit(prep(palaceG.scene), 1.15);
  palace.position.set(0, 0.0, -0.72);
  world.add(palace);

  // palms
  const palms = [
    { x: -0.92, z: -0.28, h: 1.25, ry: 0.4 },
    { x: 0.98, z: -0.12, h: 1.05, ry: 2.4 },
    { x: -0.72, z: 0.62, h: 0.85, ry: -1.2 },
  ].map((p, i) => {
    const m = fit(prep(i ? palmG.scene.clone(true) : palmG.scene), p.h);
    m.position.set(p.x, 0, p.z);
    m.rotation.y = p.ry;
    world.add(m);
    return m;
  });

  const pic = picnic();
  pic.position.set(0.74, 0.0, 0.42);
  pic.rotation.y = -0.35;
  world.add(pic);

  const ball = beachBall();
  ball.position.set(-0.55, 0.07, 0.78);
  world.add(ball);

  // characters
  const amira = character(amiraG, { wave: clipsOf(wave), cheer: clipsOf(cheer), cast: clipsOf(cast) }, 1.0, { lockLegs: true, idleWeight: 0.35 });
  amira.group.position.set(0, 0.02, 0.1);
  world.add(amira.group);

  const friends = [
    character(f1G, { cheer: clipsOf(f1Cheer) }, 0.9),
    character(f2G, { cheer: clipsOf(f2Cheer) }, 0.9),
  ];
  friends[0].group.position.set(-0.5, 0.015, 0.25);
  friends[0].group.rotation.y = 0.45;
  friends[1].group.position.set(0.48, 0.015, 0.2);
  friends[1].group.rotation.y = -0.45;
  friends.forEach((f, i) => {
    f.mixer.setTime(i * 0.7); // de-sync idles
    world.add(f.group);
  });

  // the three real Amla Kids packs are the magic items to find
  const bottleSpots = [
    [0.0, 1.32, -0.62], // above the palace dome
    [-0.92, 0.95, -0.22], // in the tall palm
    [1.05, 0.38, -0.62], // over the water
  ];
  const bottles = packs.map((pack, i) => {
    const b = pack.object;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color: BOTTLE_COLORS[i], transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    halo.scale.setScalar(0.5);
    halo.position.y = 0.13;
    halo.renderOrder = -1;
    b.add(halo);
    b.position.set(...bottleSpots[i]);
    b.userData = { kind: 'bottle', index: i, product: pack.id, color: BOTTLE_COLORS[i], home: new THREE.Vector3(...bottleSpots[i]), collected: false };
    world.add(b);
    return b;
  });

  // product line-up that rises from the sand after the win (hidden until then)
  const lineup = new THREE.Group();
  lineup.position.set(0, 0, 0.74);
  lineupPacks.forEach((pack, i) => {
    pack.object.position.set((i - 1) * 0.25, 0.0, Math.abs(i - 1) * -0.06);
    pack.object.rotation.y = (1 - i) * 0.18;
    pack.object.userData = { kind: 'product', index: i };
    lineup.add(pack.object);
  });
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.42, 0.04, 64),
    new THREE.MeshPhysicalMaterial({ color: 0xfff3e6, roughness: 0.3, clearcoat: 0.6 }),
  );
  plinth.position.y = -0.02;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  lineup.add(plinth);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(0.415, 0.008, 8, 96), new THREE.MeshStandardMaterial({ color: 0xd9a23a, metalness: 0.9, roughness: 0.25 }));
  trim.rotation.x = Math.PI / 2;
  lineup.add(trim);
  lineup.visible = false;
  lineup.userData.kind = 'product';
  world.add(lineup);

  // the Tangle Cloud
  const cloud = fit(prep(cloudG.scene, { cast: true, receive: false }), 0.42);
  const cloudGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: 0x9b4dff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  cloudGlow.scale.setScalar(1.1);
  cloudGlow.position.y = 0.2;
  cloud.add(cloudGlow);
  cloud.position.set(0.15, 1.45, -0.1);
  cloud.userData = { kind: 'cloud', home: cloud.position.clone(), defeated: false };
  world.add(cloud);

  // tap targets
  amira.group.userData.kind = 'amira';
  friends.forEach((f, i) => { f.group.userData.kind = 'friend'; f.group.userData.index = i; });
  ball.userData.kind = 'ball';

  function setSeaVisible(on) {
    if (on) { world.add(sea); world.add(lagoon); } else { world.remove(sea); world.remove(lagoon); }
  }

  function update(t, dt) {
    amira.mixer.update(dt);
    friends.forEach((f) => f.mixer.update(dt));
    sea.material.uniforms.time.value += dt * 0.35;
    palms.forEach((p, i) => { p.rotation.z = Math.sin(t * 0.7 + i * 2) * 0.012; });
    bottles.forEach((b, i) => {
      if (b.userData.collected) return;
      b.position.y = b.userData.home.y + Math.sin(t * 2 + i * 2) * 0.03;
      b.rotation.y = t * 1.1 + i;
    });
    if (!cloud.userData.defeated) {
      cloud.position.x = cloud.userData.home.x + Math.sin(t * 0.45) * 0.35;
      cloud.position.y = cloud.userData.home.y + Math.sin(t * 1.3) * 0.04;
      cloud.rotation.z = Math.sin(t * 1.8) * 0.06;
    }
  }

  return { world, amira, friends, bottles, lineup, cloud, ball, sand, setSeaVisible, update };
}
