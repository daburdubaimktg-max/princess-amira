// usage: node tools/tojson.mjs in.glb outDir  (needs @gltf-transform/core + extensions)
// GLB -> glTF JSON (buffers inlined as base64, textures as sibling .webp/.png files).
// The artifact host only serves web types, so a .glb is republished as JSON.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
import path from 'node:path';
const [inp, outDir] = process.argv.slice(2);
const name = path.basename(inp, '.glb');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
doc.getRoot().listTextures().forEach((t, i) => {
  const ext = t.getMimeType() === 'image/png' ? 'png' : t.getMimeType() === 'image/jpeg' ? 'jpg' : 'webp';
  t.setURI(`${name}_${i}.${ext}`);
});
const buf = doc.getRoot().listBuffers()[0];
buf.setURI(`${name}.bin`);
const { json, resources } = await io.writeJSON(doc);
for (const b of json.buffers || []) {
  b.uri = 'data:application/octet-stream;base64,' + Buffer.from(resources[b.uri]).toString('base64');
}
for (const img of json.images || []) {
  if (img.uri) fs.writeFileSync(path.join(outDir, img.uri), resources[img.uri]);
}
fs.writeFileSync(path.join(outDir, `${name}.glb`), JSON.stringify(json));
console.log(name, (fs.statSync(path.join(outDir, `${name}.glb`)).size / 1e6).toFixed(2) + 'MB', (json.images || []).map((i) => i.uri).join(' '));
