#!/bin/bash
# Compress a generated GLB for the web: quantized geometry + WebP textures.
# usage: tools/optimize.sh in.glb out.glb [texture-size]
# needs: npm i -g @gltf-transform/cli@4.1.1
gltf-transform optimize "$1" "$2" --compress quantize --texture-compress webp \
  --texture-size "${3:-1024}" --simplify false --join false --instance false --flatten false --palette false
