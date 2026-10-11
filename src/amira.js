// Procedural, toon-ish 3D build of Princess Amira (and her friends) made from
// primitives so the AR world runs with zero external assets. When the studio's
// rigged GLB of Amira is ready, swap `buildAmira()` for a GLTFLoader call and
// keep the same API (group, update, wave, twirl, setHairLevel, cheer).
import * as THREE from 'three';

export const PALETTE = {
  skin: 0xe9b48e,
  hair: 0x1c1317,
  dressPink: 0xd65a73,
  gold: 0xe6b74a,
  white: 0xf8f4f0,
  pearl: 0xfff4e6,
  gemPink: 0xf0628f,
  iris: 0x6e4219,
  lips: 0x9c3343,
};

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });
const GOLD = () => std(PALETTE.gold, { metalness: 0.85, roughness: 0.28 });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

const HAIR_SEG = 0.075; // length of one hair chain segment
export const HAIR_MIN = 6; // segments at level 0 (already long)
export const HAIR_MAX = 12; // segments at max level (reaches the ground)

/**
 * Chibi character, feet at y=0, facing +z, ~1 unit tall.
 * opts: dress, skirt, sleeves, gloves, crown, hairStyle ('long'|'bob'|'ponytail'), headband
 */
export function buildChibi(opts = {}) {
  const o = {
    dress: PALETTE.dressPink,
    skirt: null,
    sleeves: PALETTE.white,
    gloves: true,
    crown: true,
    hairStyle: 'long',
    headband: null,
    ...opts,
  };
  const root = new THREE.Group();
  const body = new THREE.Group(); // everything that hops/twirls
  root.add(body);

  const skin = std(PALETTE.skin, { roughness: 0.75 });
  const hairMat = std(PALETTE.hair, { roughness: 0.35, metalness: 0.15, emissive: 0x000000 });
  const dressMat = std(o.dress, { roughness: 0.5 });
  const skirtMat = o.skirt ? std(o.skirt, { roughness: 0.5 }) : dressMat;
  const gold = GOLD();
  const whiteMat = std(PALETTE.white, { roughness: 0.55 });

  // --- Skirt (bell lathe) with gold hem ---
  const skirtPts = [];
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    const y = 0.43 - k * 0.41;
    const r = 0.11 + Math.pow(k, 1.6) * 0.16;
    skirtPts.push(new THREE.Vector2(r, y));
  }
  skirtPts.reverse(); // bottom→top so lathe normals face outward
  const skirtGroup = new THREE.Group();
  body.add(skirtGroup);
  skirtGroup.add(mesh(new THREE.LatheGeometry(skirtPts, 40), skirtMat));
  const hem = mesh(new THREE.TorusGeometry(0.268, 0.012, 8, 48), gold, 0, 0.025, 0);
  hem.rotation.x = Math.PI / 2;
  skirtGroup.add(hem);

  // --- Bodice ---
  body.add(mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.18, 24), dressMat, 0, 0.51, 0));
  const waist = mesh(new THREE.TorusGeometry(0.108, 0.01, 8, 32), gold, 0, 0.43, 0);
  waist.rotation.x = Math.PI / 2;
  body.add(waist);
  // gold bow on the chest
  const bowL = mesh(new THREE.ConeGeometry(0.018, 0.04, 8), gold, -0.016, 0.555, 0.088);
  bowL.rotation.z = Math.PI / 2;
  const bowR = bowL.clone();
  bowR.position.x = 0.016;
  bowR.rotation.z = -Math.PI / 2;
  body.add(bowL, bowR);

  // pearl necklace
  const pearlNeck = std(PALETTE.pearl, { roughness: 0.25 });
  for (let i = 0; i <= 12; i++) {
    const ang = Math.PI / 2 + (i / 12 - 0.5) * 2.0;
    body.add(mesh(new THREE.SphereGeometry(0.008, 8, 6), pearlNeck, Math.cos(ang) * 0.072, 0.598, Math.sin(ang) * 0.072));
  }

  // neck
  body.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.06, 12), skin, 0, 0.615, 0));

  // --- Arms (pivot at shoulder) ---
  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.115, 0.575, 0);
    body.add(shoulder);
    shoulder.add(mesh(new THREE.SphereGeometry(0.056, 16, 12), std(o.sleeves, { roughness: 0.55 })));
    const armMat = o.gloves ? whiteMat : skin;
    const arm = mesh(new THREE.CapsuleGeometry(0.026, 0.17, 4, 10), armMat, 0, -0.11, 0);
    shoulder.add(arm);
    shoulder.add(mesh(new THREE.SphereGeometry(0.032, 12, 10), armMat, 0, -0.215, 0.005));
    shoulder.rotation.z = side * 0.32;
    shoulder.userData.rest = side * 0.32;
    arms.push(shoulder);
  }

  // --- Head ---
  const head = new THREE.Group();
  head.position.set(0, 0.77, 0);
  body.add(head);
  const skull = mesh(new THREE.SphereGeometry(0.17, 40, 30), skin);
  skull.scale.set(1, 0.98, 0.95);
  head.add(skull);

  // ears + earrings
  for (const side of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.028, 10, 8), skin, side * 0.165, -0.01, 0));
    head.add(mesh(new THREE.SphereGeometry(0.007, 8, 6), gold, side * 0.17, -0.045, 0.005));
    const drop = mesh(new THREE.SphereGeometry(0.014, 12, 10), std(PALETTE.gemPink, { roughness: 0.15, metalness: 0.2 }), side * 0.17, -0.07, 0.005);
    drop.scale.set(1, 1.35, 1);
    head.add(drop);
  }

  // eyes (big, Pixar-style)
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.062, -0.005, 0.142);
    eye.rotation.y = side * 0.32;
    head.add(eye);
    const white = mesh(new THREE.SphereGeometry(0.045, 20, 16), std(0xffffff, { roughness: 0.3 }));
    white.scale.set(1, 1.08, 0.5);
    eye.add(white);
    const iris = mesh(new THREE.SphereGeometry(0.032, 20, 16), std(PALETTE.iris, { roughness: 0.25 }), 0, -0.004, 0.012);
    iris.scale.set(1, 1.05, 0.45);
    eye.add(iris);
    const pupil = mesh(new THREE.SphereGeometry(0.017, 12, 10), std(0x0d0806, { roughness: 0.2 }), 0, -0.004, 0.022);
    pupil.scale.set(1, 1, 0.4);
    eye.add(pupil);
    const glint = mesh(new THREE.SphereGeometry(0.007, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.012, 0.012, 0.03);
    eye.add(glint);
    // upper lash line
    const lash = mesh(new THREE.TorusGeometry(0.045, 0.0055, 6, 20, Math.PI), std(0x120a0a), 0, 0.002, 0.008);
    lash.scale.set(1, 1.1, 1);
    eye.add(lash);
    eyes.push(eye);
    // brow
    const brow = mesh(new THREE.CapsuleGeometry(0.006, 0.05, 3, 6), std(PALETTE.hair), side * 0.064, 0.062, 0.148);
    brow.rotation.z = Math.PI / 2 + side * 0.12;
    brow.rotation.y = side * 0.3;
    head.add(brow);
  }

  // nose, smile, blush
  head.add(mesh(new THREE.SphereGeometry(0.012, 10, 8), skin, 0, -0.04, 0.165));
  const smile = mesh(new THREE.TorusGeometry(0.026, 0.0065, 8, 18, Math.PI), std(PALETTE.lips, { roughness: 0.4 }), 0, -0.068, 0.15);
  smile.rotation.z = Math.PI;
  smile.rotation.x = -0.25;
  head.add(smile);
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7a8a, transparent: true, opacity: 0.3, depthWrite: false });
  for (const side of [-1, 1]) {
    const b = mesh(new THREE.SphereGeometry(0.028, 12, 8), blushMat, side * 0.098, -0.05, 0.125);
    b.scale.set(1, 0.6, 0.25);
    b.rotation.y = side * 0.6;
    b.castShadow = false;
    head.add(b);
  }

  // --- Hair: cap, bangs, side locks ---
  const cap = mesh(new THREE.SphereGeometry(0.182, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, 0, 0.012, -0.01);
  cap.rotation.x = -0.36;
  head.add(cap);
  const backHead = mesh(new THREE.SphereGeometry(0.176, 28, 20), hairMat, 0, -0.02, -0.04);
  backHead.scale.set(1.03, 1.04, 0.95);
  head.add(backHead);
  // swept bangs
  for (let i = 0; i < 5; i++) {
    const x = -0.11 + i * 0.055;
    const bang = mesh(new THREE.SphereGeometry(0.05, 14, 10), hairMat, x, 0.1 - Math.abs(x) * 0.25, 0.12 - Math.abs(x) * 0.25);
    bang.scale.set(1.1, 0.6, 0.55);
    bang.rotation.z = -0.45 + i * 0.12;
    head.add(bang);
  }
  // side locks framing the face
  if (o.hairStyle !== 'ponytail') {
    for (const side of [-1, 1]) {
      const lock = mesh(new THREE.CapsuleGeometry(0.042, o.hairStyle === 'long' ? 0.2 : 0.08, 4, 10), hairMat,
        side * 0.155, o.hairStyle === 'long' ? -0.11 : -0.05, 0.02);
      lock.rotation.z = side * -0.12;
      lock.scale.z = 0.8;
      head.add(lock);
    }
  }

  // headband (friend)
  if (o.headband) {
    const hb = mesh(new THREE.TorusGeometry(0.178, 0.012, 8, 40, Math.PI), std(o.headband, { roughness: 0.4 }), 0, 0.03, 0.0);
    hb.rotation.x = -0.35; // arc runs ear-to-ear over the top
    head.add(hb);
  }

  // --- Long back hair: a swaying chain of segments ---
  const chainRoot = new THREE.Group();
  const isPony = o.hairStyle === 'ponytail';
  chainRoot.position.set(0, isPony ? 0.1 : -0.04, isPony ? -0.15 : -0.12);
  head.add(chainRoot);
  const segs = [];
  const segCount = o.hairStyle === 'long' ? HAIR_MAX : o.hairStyle === 'bob' ? 3 : 6;
  let parent = chainRoot;
  for (let i = 0; i < segCount; i++) {
    const pivot = new THREE.Group();
    if (i > 0) pivot.position.y = -HAIR_SEG;
    parent.add(pivot);
    const k = i / Math.max(1, segCount - 1);
    const w = isPony ? 0.9 - k * 0.5 : 2.1 - k * 0.7;
    const s = mesh(new THREE.CapsuleGeometry(0.055, 0.04, 4, 12), hairMat, 0, -HAIR_SEG / 2, 0);
    s.scale.set(w, 1, isPony ? 0.9 : 0.62);
    pivot.add(s);
    pivot.userData.base = isPony ? (i === 0 ? 1.1 : -0.2) : 0.055;
    segs.push(pivot);
    parent = pivot;
  }

  // --- Crown ---
  let crown = null;
  if (o.crown) {
    crown = new THREE.Group();
    crown.position.set(0, 0.165, -0.015);
    crown.rotation.x = -0.2;
    head.add(crown);
    const band = mesh(new THREE.CylinderGeometry(0.088, 0.098, 0.035, 32, 1, true), gold);
    band.material = gold.clone();
    band.material.side = THREE.DoubleSide;
    crown.add(band);
    const pearlMat = std(PALETTE.pearl, { roughness: 0.2 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const front = Math.cos(a);
      const h = 0.04 + Math.max(0, front) * 0.04;
      const spike = mesh(new THREE.ConeGeometry(0.018, h, 8), gold, Math.sin(a) * 0.092, 0.017 + h / 2, Math.cos(a) * 0.092);
      crown.add(spike);
      crown.add(mesh(new THREE.SphereGeometry(0.009, 8, 6), pearlMat, Math.sin(a) * 0.092, 0.02 + h, Math.cos(a) * 0.092));
    }
    const gem = mesh(new THREE.SphereGeometry(0.02, 16, 12), std(PALETTE.gemPink, { roughness: 0.1, metalness: 0.3, emissive: 0x5a0d26 }), 0, 0.035, 0.1);
    gem.scale.set(0.8, 1.25, 0.6);
    crown.add(gem);
  }

  // ---------------- Animation API ----------------
  const state = {
    hairLevel: 0, // 0..3
    hairShown: o.hairStyle === 'long' ? HAIR_MIN : segCount,
    action: null, // {type, t0, dur}
    blinkAt: 1 + Math.random() * 3,
    shine: 0,
  };

  if (o.hairStyle === 'long') {
    segs.forEach((p, i) => { p.visible = i < HAIR_MIN; });
  }

  function setHairLevel(level) {
    if (level > state.hairLevel) state.shine = 1.5;
    state.hairLevel = level;
  }

  function play(type, dur) {
    state.action = { type, t0: performance.now() / 1000, dur };
  }

  function update(t, dt) {
    // idle bob + breathing
    body.position.y = Math.sin(t * 2.2) * 0.006;
    head.rotation.z = Math.sin(t * 0.9) * 0.04;
    head.rotation.y = Math.sin(t * 0.6) * 0.08;

    // blink
    const blinking = t > state.blinkAt && t < state.blinkAt + 0.12;
    if (t > state.blinkAt + 0.12) state.blinkAt = t + 2 + Math.random() * 3;
    for (const e of eyes) e.scale.y = blinking ? 0.12 : 1;

    // arms rest sway
    arms.forEach((a, i) => {
      a.rotation.z = a.userData.rest + Math.sin(t * 1.6 + i) * 0.04;
      a.rotation.x = 0;
    });

    // hair growth (smoothly reveal segments)
    if (o.hairStyle === 'long') {
      const target = HAIR_MIN + Math.round((state.hairLevel / 3) * (HAIR_MAX - HAIR_MIN));
      state.hairShown += (target - state.hairShown) * Math.min(1, dt * 2.5);
      segs.forEach((p, i) => {
        const vis = THREE.MathUtils.clamp(state.hairShown - i, 0, 1);
        p.visible = vis > 0.01;
        p.scale.setScalar(0.4 + vis * 0.6);
      });
    }
    // sway the chain
    segs.forEach((p, i) => {
      p.rotation.x = p.userData.base + Math.sin(t * 1.8 - i * 0.45) * 0.035 * (1 + i * 0.12);
      p.rotation.z = Math.sin(t * 1.3 - i * 0.5) * 0.03 * (1 + i * 0.1);
    });
    // golden shine after growth
    state.shine = Math.max(0, state.shine - dt * 0.6);
    hairMat.emissive.setRGB(0.16 * state.shine, 0.1 * state.shine, 0.02 * state.shine); // golden glint, keeps hair black

    // one-shot actions
    const a = state.action;
    body.rotation.y = 0;
    skirtGroup.scale.set(1, 1, 1);
    if (a) {
      const k = (performance.now() / 1000 - a.t0) / a.dur;
      if (k >= 1) state.action = null;
      else if (a.type === 'wave') {
        const r = arms[1];
        r.rotation.z = THREE.MathUtils.lerp(r.userData.rest, 2.5, Math.min(1, k * 5)) + Math.sin(k * Math.PI * 8) * 0.25;
        r.rotation.x = -0.2;
      } else if (a.type === 'twirl') {
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        body.rotation.y = e * Math.PI * 2;
        body.position.y += Math.sin(k * Math.PI) * 0.08;
        const flare = 1 + Math.sin(k * Math.PI) * 0.18;
        skirtGroup.scale.set(flare, 1 - (flare - 1) * 0.3, flare);
        arms.forEach((ar, i) => { ar.rotation.z = ar.userData.rest + (i ? 1 : -1) * Math.sin(k * Math.PI) * 0.9; });
      } else if (a.type === 'cheer') {
        body.position.y += Math.abs(Math.sin(k * Math.PI * 3)) * 0.07;
        arms.forEach((ar, i) => { ar.rotation.z = (i ? 1 : -1) * (2.4 + Math.sin(k * 30) * 0.15); });
      } else if (a.type === 'cast') {
        // both arms forward, pointing at the target
        arms.forEach((ar) => { ar.rotation.x = -THREE.MathUtils.lerp(0, 1.9, Math.min(1, k * 4)); ar.rotation.z = ar.userData.rest * 0.3; });
      }
    }
  }

  // world position of the hair tip (for sparkle emission)
  const tip = new THREE.Vector3();
  function hairTipWorld() {
    const i = Math.max(0, Math.min(segs.length - 1, Math.floor(state.hairShown) - 1));
    return segs[i].getWorldPosition(tip);
  }
  const headPos = new THREE.Vector3();
  function headWorld() { return head.getWorldPosition(headPos); }

  return {
    group: root,
    update,
    wave: () => play('wave', 1.6),
    twirl: () => play('twirl', 1.2),
    cheer: () => play('cheer', 1.8),
    cast: () => play('cast', 1.6),
    setHairLevel,
    hairTipWorld,
    headWorld,
    get busy() { return !!state.action; },
  };
}

export function buildAmira() {
  return buildChibi();
}

export function buildFriends() {
  const blue = buildChibi({
    dress: 0x3c6db5, sleeves: 0xf3efe8, gloves: false, crown: false, hairStyle: 'bob', headband: 0x2f5fb0,
  });
  const pony = buildChibi({
    dress: 0x24232c, skirt: 0xe68aa2, sleeves: 0x24232c, gloves: false, crown: false, hairStyle: 'ponytail',
  });
  return [blue, pony];
}
