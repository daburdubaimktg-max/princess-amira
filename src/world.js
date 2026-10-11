// Amira's palace-beach island: the diorama that gets placed in AR.
import * as THREE from 'three';
import { buildAmira, buildFriends, PALETTE } from './amira.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const GOLD = std(PALETTE.gold, { metalness: 0.85, roughness: 0.3 });

function m(geo, mat, x = 0, y = 0, z = 0) {
  const r = new THREE.Mesh(geo, mat);
  r.position.set(x, y, z);
  r.castShadow = true;
  r.receiveShadow = true;
  return r;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function palmTree(height = 0.8, lean = 0.15) {
  const g = new THREE.Group();
  const trunkMat = std(0x9a6a3c, { roughness: 0.9 });
  const n = 7;
  let p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const seg = m(new THREE.CylinderGeometry(0.03 - k * 0.012, 0.036 - k * 0.012, height / n * 1.05, 8), trunkMat);
    const next = new THREE.Vector3(Math.sin(k * 1.4) * lean, (i + 0.5) * (height / n), 0);
    seg.position.copy(next);
    seg.rotation.z = -Math.cos(k * 1.4) * lean * 1.4;
    g.add(seg);
    p = next;
  }
  const top = new THREE.Group();
  top.position.set(p.x, height, 0);
  g.add(top);
  const leafMat = std(0x3f9e4a, { roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const leaf = m(new THREE.ConeGeometry(0.06, 0.42, 4, 1), leafMat);
    leaf.scale.z = 0.18;
    leaf.geometry.translate(0, 0.21, 0);
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 8) * Math.PI * 2;
    leaf.rotation.x = 1.9 + (i % 2) * 0.25;
    pivot.add(leaf);
    top.add(pivot);
  }
  for (let i = 0; i < 3; i++) {
    top.add(m(new THREE.SphereGeometry(0.03, 10, 8), std(0x6b4423), Math.cos(i * 2.1) * 0.035, -0.03, Math.sin(i * 2.1) * 0.035));
  }
  g.userData.top = top;
  return g;
}

function palace() {
  const g = new THREE.Group();
  const wall = std(0xf6e7cc, { roughness: 0.85 });
  const dome = std(0xeaa2ba, { roughness: 0.45 });
  const dark = std(0x6a3a2c);
  // base
  g.add(m(new THREE.BoxGeometry(0.9, 0.34, 0.3), wall, 0, 0.17, 0));
  g.add(m(new THREE.BoxGeometry(0.95, 0.03, 0.34), GOLD, 0, 0.35, 0));
  // central drum + onion dome
  g.add(m(new THREE.CylinderGeometry(0.15, 0.15, 0.16, 24), wall, 0, 0.44, 0));
  const onionPts = [];
  for (let i = 0; i <= 16; i++) {
    const k = i / 16;
    onionPts.push(new THREE.Vector2(Math.sin(k * Math.PI) * 0.19 * (1 - k * 0.55) + (k < 0.1 ? 0.15 * (1 - k * 10) : 0), k * 0.32));
  }
  g.add(m(new THREE.LatheGeometry(onionPts, 32), dome, 0, 0.52, 0));
  g.add(m(new THREE.ConeGeometry(0.012, 0.1, 8), GOLD, 0, 0.88, 0));
  g.add(m(new THREE.SphereGeometry(0.02, 10, 8), GOLD, 0, 0.85, 0));
  // minarets
  for (const s of [-1, 1]) {
    g.add(m(new THREE.CylinderGeometry(0.045, 0.055, 0.7, 16), wall, s * 0.5, 0.35, 0.02));
    g.add(m(new THREE.TorusGeometry(0.058, 0.01, 6, 20), GOLD, s * 0.5, 0.55, 0.02).rotateX(Math.PI / 2));
    g.add(m(new THREE.SphereGeometry(0.06, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome, s * 0.5, 0.7, 0.02));
    g.add(m(new THREE.ConeGeometry(0.008, 0.07, 6), GOLD, s * 0.5, 0.79, 0.02));
  }
  // arched door + windows
  const arch = (w, h) => {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(-w / 2, h - w / 2);
    sh.absarc(0, h - w / 2, w / 2, Math.PI, 0, true);
    sh.lineTo(w / 2, 0);
    return new THREE.ShapeGeometry(sh, 12);
  };
  g.add(m(arch(0.13, 0.22), dark, 0, 0.0, 0.151));
  const door = m(arch(0.15, 0.235), GOLD, 0, -0.005, 0.1505);
  g.add(door);
  for (const x of [-0.3, -0.17, 0.17, 0.3]) g.add(m(arch(0.05, 0.1), dark, x, 0.13, 0.151));
  return g;
}

function magicBottle(color, label) {
  const g = new THREE.Group();
  const pts = [
    [0.0, 0], [0.04, 0], [0.046, 0.01], [0.046, 0.1], [0.04, 0.12], [0.02, 0.135], [0.018, 0.15], [0, 0.15],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = m(new THREE.LatheGeometry(pts, 24), std(color, { roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.92 }));
  g.add(body);
  g.add(m(new THREE.CylinderGeometry(0.02, 0.02, 0.035, 16), GOLD, 0, 0.165, 0));
  // little crown on the cap
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(m(new THREE.ConeGeometry(0.006, 0.018, 5), GOLD, Math.sin(a) * 0.016, 0.19, Math.cos(a) * 0.016));
  }
  const tex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#fff8ee';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#' + new THREE.Color(color).getHexString();
    c.fillRect(0, 0, w, 14);
    c.fillRect(0, h - 14, w, 14);
    c.fillStyle = '#2d6b2f';
    c.font = 'bold 40px system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('AMLA', w / 2, 62);
    c.fillStyle = '#7a3b8f';
    c.font = 'bold 26px system-ui, sans-serif';
    c.fillText(label, w / 2, 98);
  });
  const lbl = m(new THREE.CylinderGeometry(0.0475, 0.0475, 0.06, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }), 0, 0.055, 0);
  lbl.castShadow = false;
  g.add(lbl);
  // glow halo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.scale.setScalar(0.35);
  halo.position.y = 0.08;
  g.add(halo);
  g.scale.setScalar(1.15);
  return g;
}

let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTex(128, 128, (c, w) => {
    const grd = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = grd;
    c.fillRect(0, 0, w, w);
  });
  return _glow;
}

function tangleCloud() {
  const g = new THREE.Group();
  const mat = std(0x4b2470, { roughness: 0.9, emissive: 0x2a0b45 });
  const puffs = [[0, 0, 0, 0.16], [0.15, -0.02, 0, 0.12], [-0.15, -0.02, 0, 0.12], [0.08, 0.08, -0.03, 0.12], [-0.08, 0.08, -0.03, 0.11], [0.24, -0.05, -0.02, 0.08], [-0.24, -0.05, -0.02, 0.08]];
  for (const [x, y, z, r] of puffs) g.add(m(new THREE.SphereGeometry(r, 18, 14), mat, x, y, z));
  // angry eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe14d });
  for (const s of [-1, 1]) {
    const e = m(new THREE.SphereGeometry(0.03, 12, 10), eyeMat, s * 0.06, 0.01, 0.15);
    e.scale.set(1.2, 0.6, 0.4);
    e.rotation.z = s * 0.4;
    g.add(e);
    const brow = m(new THREE.BoxGeometry(0.07, 0.014, 0.01), std(0x1a0a26), s * 0.06, 0.05, 0.155);
    brow.rotation.z = s * -0.45;
    g.add(brow);
  }
  // squiggly "tangle" lightning
  const tangleMat = new THREE.MeshBasicMaterial({ color: 0xb06cff });
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, k) =>
      new THREE.Vector3((i - 1) * 0.12 + Math.sin(k * 2.3 + i) * 0.03, -0.12 - k * 0.04, 0.02)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.006, 5), tangleMat));
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x9b4dff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.setScalar(0.9);
  g.add(glow);
  return g;
}

export function buildWorld() {
  const world = new THREE.Group();
  world.name = 'AmiraWorld';

  // island + shallow water ring
  world.add(m(new THREE.CylinderGeometry(1.15, 1.0, 0.1, 64), std(0xf1d6a2, { roughness: 1 }), 0, -0.05, 0));
  const water = m(new THREE.RingGeometry(1.1, 1.6, 64), std(0x3fc1d6, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8 }), 0, -0.03, 0);
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  world.add(water);
  // foam
  const foam = m(new THREE.TorusGeometry(1.12, 0.012, 6, 80), std(0xffffff, { roughness: 0.6 }), 0, -0.025, 0);
  foam.rotation.x = Math.PI / 2;
  world.add(foam);

  const pal = palace();
  pal.position.set(0, 0, -0.68);
  world.add(pal);

  const palms = [
    [palmTree(0.9, 0.18), -0.85, -0.25, 0.4],
    [palmTree(0.75, 0.22), 0.88, -0.05, 2.6],
    [palmTree(0.6, 0.14), -0.68, 0.55, -0.8],
  ];
  for (const [p, x, z, ry] of palms) { p.position.set(x, 0, z); p.rotation.y = ry; world.add(p); }

  // picnic blanket + basket (from the beach episode)
  const blanketTex = canvasTex(128, 128, (c, w) => {
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      c.fillStyle = (i + j) % 2 ? '#e88db0' : '#a27fd6';
      c.fillRect(i * s, j * s, s, s);
    }
  });
  const blanket = m(new THREE.PlaneGeometry(0.5, 0.38), new THREE.MeshStandardMaterial({ map: blanketTex, roughness: 0.9 }), 0.42, 0.003, 0.5);
  blanket.rotation.x = -Math.PI / 2;
  blanket.rotation.z = 0.3;
  world.add(blanket);
  const basket = new THREE.Group();
  basket.position.set(0.42, 0, 0.5);
  basket.add(m(new THREE.CylinderGeometry(0.07, 0.055, 0.06, 16), std(0xb07a3e), 0, 0.03, 0));
  const fruitCols = [0x8bc34a, 0x9ccc65, 0xe53935, 0xffb300, 0x7cb342];
  fruitCols.forEach((c, i) => basket.add(m(new THREE.SphereGeometry(0.022, 10, 8), std(c, { roughness: 0.4 }), Math.cos(i * 1.3) * 0.035, 0.07, Math.sin(i * 1.3) * 0.035)));
  world.add(basket);

  // sand castle
  const sand = std(0xe3c48a, { roughness: 1 });
  const castle = new THREE.Group();
  castle.position.set(0.78, 0, 0.5);
  castle.add(m(new THREE.BoxGeometry(0.16, 0.06, 0.12), sand, 0, 0.03, 0));
  for (const [x, z] of [[-0.07, -0.05], [0.07, -0.05], [-0.07, 0.05], [0.07, 0.05]]) {
    castle.add(m(new THREE.CylinderGeometry(0.025, 0.028, 0.1, 10), sand, x, 0.05, z));
    castle.add(m(new THREE.ConeGeometry(0.028, 0.04, 10), sand, x, 0.12, z));
  }
  world.add(castle);

  // beach ball
  const ballTex = canvasTex(256, 128, (c, w, h) => {
    const cols = ['#e53935', '#ffffff', '#1e88e5', '#ffffff', '#fdd835', '#ffffff'];
    cols.forEach((col, i) => { c.fillStyle = col; c.fillRect((i * w) / cols.length, 0, w / cols.length + 1, h); });
  });
  const ball = m(new THREE.SphereGeometry(0.06, 24, 16), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.35 }), -0.3, 0.06, 0.78);
  world.add(ball);

  // characters
  const amira = buildAmira();
  amira.group.position.set(0, 0, 0.12);
  world.add(amira.group);
  const friends = buildFriends();
  friends[0].group.position.set(-0.42, 0, 0.22);
  friends[0].group.rotation.y = 0.45;
  friends[1].group.position.set(0.4, 0, 0.18);
  friends[1].group.rotation.y = -0.45;
  friends.forEach((f) => { f.group.scale.setScalar(0.92); world.add(f.group); });

  // the three magic bottles (gold, pink, purple — like the Amla Kids range)
  const bottleDefs = [
    { color: 0xe7b53b, label: 'KIDS', pos: [0, 1.0, -0.68] }, // above the palace dome
    { color: 0xec5d93, label: 'KIDS', pos: [-0.85, 0.62, -0.25] }, // in the tall palm
    { color: 0x8e5bd6, label: 'KIDS', pos: [0.95, 0.32, -0.62] }, // over the water
  ];
  const bottles = bottleDefs.map((d, i) => {
    const b = magicBottle(d.color, d.label);
    b.position.set(...d.pos);
    b.userData = { kind: 'bottle', index: i, color: d.color, home: new THREE.Vector3(...d.pos), collected: false };
    world.add(b);
    return b;
  });

  const cloud = tangleCloud();
  cloud.position.set(0.15, 1.25, -0.15);
  cloud.userData = { kind: 'cloud', home: cloud.position.clone(), defeated: false };
  world.add(cloud);

  // tag tappables
  amira.group.userData.kind = 'amira';
  friends.forEach((f, i) => { f.group.userData.kind = 'friend'; f.group.userData.index = i; });
  ball.userData.kind = 'ball';

  world.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });

  function update(t, dt) {
    amira.update(t, dt);
    friends.forEach((f, i) => f.update(t + i * 1.7, dt));
    for (const p of palms) {
      const top = p[0].userData.top;
      top.rotation.z = Math.sin(t * 0.8 + p[1]) * 0.05;
      top.rotation.x = Math.cos(t * 0.6 + p[2]) * 0.04;
    }
    bottles.forEach((b, i) => {
      if (b.userData.collected) return;
      b.position.y = b.userData.home.y + Math.sin(t * 2 + i * 2) * 0.03;
      b.rotation.y = t * 1.2 + i;
    });
    if (!cloud.userData.defeated) {
      cloud.position.x = cloud.userData.home.x + Math.sin(t * 0.5) * 0.35;
      cloud.position.y = cloud.userData.home.y + Math.sin(t * 1.3) * 0.04;
      cloud.rotation.z = Math.sin(t * 2) * 0.05;
    }
    water.material.opacity = 0.75 + Math.sin(t * 1.5) * 0.05;
    foam.scale.setScalar(1 + Math.sin(t * 1.2) * 0.008);
  }

  return { world, amira, friends, bottles, cloud, ball, update };
}
