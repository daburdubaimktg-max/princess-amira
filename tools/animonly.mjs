// usage: node tools/animonly.mjs rigged.glb out.glb  (needs @gltf-transform/core + functions)
// Keep only the skeleton + animation from a rigged GLB (drops mesh, materials, textures).
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';
const [inp, out] = process.argv.slice(2);
const io = new NodeIO();
const doc = await io.read(inp);
for (const n of doc.getRoot().listNodes()) { n.setMesh(null); n.setSkin(null); }
for (const m of doc.getRoot().listMeshes()) m.dispose();
for (const s of doc.getRoot().listSkins()) s.dispose();
await doc.transform(prune());
await io.write(out, doc);
