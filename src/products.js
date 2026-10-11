// Real Dabur Amla Kids packs as 3D objects. Each bottle is a lathe built from the
// silhouette traced off the official packshot (tools/build_products.py); the front
// half carries the packshot itself so the logo and copy are pixel-exact.
import * as THREE from 'three';

export const PRODUCTS = [
  { id: 'oil', color: 0xe0a33a },
  { id: 'detangler', color: 0xe8408f },
  { id: 'shampoo', color: 0x8a4fd8 },
];

const DEPTH = 0.6; // bottles are oval, not round: front-to-back vs side-to-side
const SEGMENTS = 48; // per half

function half(meta, front) {
  const prof = [[0, 0], ...meta.profile];
  const rows = prof.length;
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i < rows; i++) {
    const [r, y] = prof[i];
    for (let j = 0; j <= SEGMENTS; j++) {
      // front: θ -90°..90° (faces +z); back: 90°..270°
      const th = (front ? -Math.PI / 2 : Math.PI / 2) + (j / SEGMENTS) * Math.PI;
      const x = r * Math.sin(th);
      const z = r * DEPTH * Math.cos(th);
      pos.push(x, y, z);
      const u = THREE.MathUtils.clamp(meta.cx + x / meta.aspect, 0, 1);
      uv.push(front ? u * 0.5 : 0.5 + u * 0.5, y);
    }
  }
  const stride = SEGMENTS + 1;
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = i * stride + j, b = a + 1, c = a + stride, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Load all three packs. Returns [{id, color, object}] with each bottle `height` tall. */
export async function loadProducts(baseUrl, manager, height = 0.26) {
  const tl = new THREE.TextureLoader(manager);
  const fl = new THREE.FileLoader(manager).setResponseType('json');
  return Promise.all(PRODUCTS.map(async (p) => {
    const [meta, tex] = await Promise.all([
      fl.loadAsync(new URL(`products/${p.id}.json`, baseUrl).href),
      tl.loadAsync(new URL(`products/${p.id}.webp`, baseUrl).href),
    ]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      alphaTest: 0.5, // cuts the crown prongs / spray nozzle out of the lathe
      side: THREE.DoubleSide,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 0.8, // glossy printed plastic
      clearcoatRoughness: 0.12,
    });
    const object = new THREE.Group();
    for (const front of [true, false]) {
      const m = new THREE.Mesh(half(meta, front), mat);
      m.castShadow = true;
      m.receiveShadow = true;
      object.add(m);
    }
    object.scale.setScalar(height);
    const holder = new THREE.Group();
    holder.add(object);
    return { ...p, object: holder };
  }));
}
