"""Turn official Amla Kids packshots (white background) into AR product assets.

For each packshot this writes:
  assets/products/<name>.webp  - RGBA atlas: left half = front art, right half = back
  assets/products/<name>.json  - silhouette profile (half-width per row) for the 3D lathe

The front of the 3D bottle is a planar projection of the packshot, so logos and
copy stay pixel-exact. The back is synthesised from each row's side colours.

Usage: python3 tools/build_products.py oil=path.jpg detangler=path.jpg shampoo=path.jpg
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'products'
H = 1024  # atlas height
STEP = 4  # profile sampling (source px)


def build(name, src):
    img = Image.open(src).convert('RGB')
    a = np.asarray(img).astype(np.int16)
    mask = a.min(axis=2) < 238
    # white logo/copy inside the bottle isn't background: keep only what the outside
    # border can reach by flood fill as transparent (crown-prong gaps stay open)
    outside = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).copy()  # writable copy
    ImageDraw.floodfill(outside, (0, 0), 128)
    mask = np.asarray(outside) != 128
    widths = mask.sum(axis=1)
    rows = np.where(widths > 0)[0]
    top = rows.min()
    # the packshots carry a floor reflection; the base is the widest row in the lower part
    lower = np.arange(len(widths)) > (top + (rows.max() - top) * 0.6)
    base = int(np.argmax(np.where(lower, widths, 0))) + 2

    # silhouette per row: left/right extents of the mask
    cols = np.arange(a.shape[1])
    left = np.array([cols[m].min() if m.any() else -1 for m in mask])
    right = np.array([cols[m].max() if m.any() else -1 for m in mask])
    valid = left[top:base] >= 0
    cx = float(np.median(((left + right) / 2)[top:base][valid][len(valid) // 3:]))

    # crop square-ish around the bottle
    half_w = int(max(cx - left[top:base][valid].min(), right[top:base][valid].max() - cx)) + 6
    x0, x1 = int(cx - half_w), int(cx + half_w)
    crop = img.crop((x0, top, x1, base))
    cmask = Image.fromarray((mask[top:base, x0:x1] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    w, h = crop.size
    scale = H / h
    W = int(round(w * scale))
    front = crop.resize((W, H), Image.LANCZOS)
    alpha = cmask.resize((W, H), Image.LANCZOS)

    # back: stretch each row's side colour (sampled just inside the edge) across the row
    f = np.asarray(front).astype(np.float32)
    am = np.asarray(alpha) > 128
    back = np.zeros_like(f)
    for y in range(H):
        xs = np.where(am[y])[0]
        if len(xs) < 4:
            continue
        lo, hi = xs.min(), xs.max()
        inset = max(2, int((hi - lo) * 0.06))
        cl = f[y, min(hi, lo + inset)]
        cr = f[y, max(lo, hi - inset)]
        t = np.linspace(0, 1, W)[:, None]
        back[y] = cl * (1 - t) + cr * t
    back_img = Image.fromarray(back.clip(0, 255).astype(np.uint8))
    # soften into smooth bands so the back reads as plain bottle colour
    back_img = back_img.resize((max(1, W // 8), H // 32), Image.BOX).resize((W, H), Image.BICUBIC)

    atlas = Image.new('RGBA', (W * 2, H))
    atlas.paste(Image.merge('RGBA', (*front.split(), alpha)), (0, 0))
    atlas.paste(Image.merge('RGBA', (*back_img.split(), alpha)), (W, 0))
    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT / f'{name}.webp', quality=90, method=6)

    # half-width profile, normalised so total height = 1 (y=0 at the base)
    prof = []
    for y in range(top, base, STEP):
        if left[y] < 0:
            r = 0.0
        else:
            r = max(cx - left[y], right[y] - cx)
        prof.append([round(r / h, 5), round((base - y) / h, 5)])
    prof.append([prof[-1][0], 0.0])
    meta = {
        'aspect': w / h,  # crop width / height
        'cx': (cx - x0) / w,  # bottle axis in crop-relative u
        'profile': prof[::-1],  # bottom -> top
    }
    (OUT / f'{name}.json').write_text(json.dumps(meta))
    print(name, 'crop', (w, h), 'atlas', atlas.size, 'rows', len(prof))


if __name__ == '__main__':
    for arg in sys.argv[1:]:
        n, p = arg.split('=', 1)
        build(n, p)
