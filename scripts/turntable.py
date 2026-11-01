"""
Builds the hero turntable from a green-screen spin video (e.g. made with Flow).

    python scripts/turntable.py source-assets/hero/jacket-turntable.mp4 --still source-assets/hero/jacket-front.png

Writes transparent frames at even angle steps (frame 0 faces the camera;
angles increase the same way as three.js rotation.y) to public/hero/turntable/:
every frame small on one sheet (atlas.webp), so any angle can be drawn at
once, and each frame large (frames/NNN.webp) for when the garment is still,
with manifest.json beside them. --still also writes public/hero/jacket.webp,
the cut-out still used by the static fallback.

The video needs one full turn, starting from the front, with a locked camera
on a flat green background. Its speed may vary: each frame's angle is
measured from the silhouette (see measure_angles).

Requires ffmpeg on PATH and Python with numpy, Pillow and scipy.
"""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "hero"


def video_frames(path):
    probe = subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)],
        text=True,
    )
    w, h = map(int, probe.strip().split(","))
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    size = w * h * 3
    while len(buf := proc.stdout.read(size)) == size:
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    proc.wait()


def background(rgb):
    """Median colour of the four corners."""
    s = max(8, min(rgb.shape[:2]) // 20)
    corners = [rgb[:s, :s], rgb[:s, -s:], rgb[-s:, :s], rgb[-s:, -s:]]
    return np.median(np.concatenate([c.reshape(-1, 3) for c in corners]), axis=0).astype(np.float32)


def silhouette(rgb, bg):
    """Soft alpha from how much greener than neutral each pixel is, and the
    subject as a solid mask: the largest shape plus any big pieces, without
    specks or watermarks."""
    f = rgb.astype(np.float32)
    green = f[..., 1] - np.maximum(f[..., 0], f[..., 2])
    bg_green = bg[1] - max(bg[0], bg[2])
    lo, hi = 0.18 * bg_green, 0.92 * bg_green
    alpha = np.clip((hi - green) / (hi - lo), 0, 1)

    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    if count:
        areas = ndimage.sum(solid, labels, range(1, count + 1))
        solid = np.isin(labels, 1 + np.nonzero(areas >= 0.01 * areas.max())[0])
    return f, alpha, solid


def cut_out(rgb, bg):
    """RGBA image of the subject with green spill removed. The edge takes
    the colour from just inside it, and the matte is pulled in a pixel, so
    the pale halo that video sharpening leaves against green doesn't show."""
    f, alpha, solid = silhouette(rgb, bg)
    holes, count = ndimage.label(ndimage.binary_fill_holes(solid) & ~solid)
    if count:
        areas = ndimage.sum(holes > 0, holes, range(1, count + 1))
        solid |= np.isin(holes, 1 + np.nonzero(areas < 0.0002 * solid.size)[0])
    alpha *= ndimage.binary_dilation(solid, iterations=2)
    alpha[ndimage.binary_erosion(solid, iterations=3)] = 1
    alpha = ndimage.grey_erosion(alpha, size=3)

    f[..., 1] = np.minimum(f[..., 1], np.maximum(f[..., 0], f[..., 2]))
    inner = ndimage.binary_erosion(solid, iterations=2)
    iy, ix = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    color = f[iy, ix]
    rgba = np.dstack([color, alpha * 255]).round().astype(np.uint8)
    rgba[alpha == 0] = 0
    return Image.fromarray(rgba, "RGBA"), solid


def bounds(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), xs.max() + 1, ys.min(), ys.max() + 1


def measure_angles(widths):
    """Degrees per frame, with frame 0 at 0.

    A symmetric garment's silhouette width is symmetric about each profile,
    the back and the front, so two frames of equal width either side of one
    of those views sit at mirror-image angles. Those pairings, plus a
    preference for smooth changes of speed, place every frame even when the
    clip eases in and out.
    """
    n = len(widths)
    w = np.convolve(np.pad(widths, 1, mode="edge"), np.ones(3) / 3, mode="valid")
    slope = np.abs(np.gradient(w))

    def plateau(lo, hi, sign):
        seg = sign * w[lo:hi]
        return lo + np.nonzero(seg >= seg.max() - 0.01 * w.max())[0].mean()

    def crossing(v, lo, hi):
        """Fractional frame in [lo, hi) where the width passes v."""
        seg = w[lo:hi]
        sign = 1 if seg[-1] > seg[0] else -1
        ramp = np.maximum.accumulate(sign * seg)
        return float(np.interp(sign * v, ramp, np.arange(lo, hi))) if ramp[0] <= sign * v <= ramp[-1] else None

    p1 = plateau(0, n // 2, -1)
    p2 = plateau(n // 2, n, -1)
    back = plateau(int(p1), int(p2), 1)
    a, b, c = (int(round(v)) for v in (p1, back, p2))

    rows, rhs = [], []

    def equation(terms, value, weight):
        row = np.zeros(n)
        for k, coeff in terms:
            row[k] += coeff * weight
        rows.append(row)
        rhs.append(value * weight)

    equation([(0, 1)], 0, 1000)
    mirrors = [((b // 3, a), (a, b), 180), ((a + 5, b), (b, c - 5), 360), ((b + 5, c), (c, n), 540), ((0, a - 10), (c + 10, n), 360)]
    for left, right, total in mirrors:
        for i in range(*left):
            j = crossing(w[i], *right)
            if j is None:
                continue
            j0 = min(int(j), n - 2)
            reliability = min(slope[i], slope[int(round(j))], 8) / 4  # flat widths pair loosely
            equation([(i, 1), (j0, 1 - (j - j0)), (j0 + 1, j - j0)], total, reliability)
    for k in range(1, n - 1):
        equation([(k - 1, 1), (k, -2), (k + 1, 1)], 0, 50)

    angles = np.linalg.lstsq(np.array(rows), np.array(rhs), rcond=None)[0]
    angles = np.maximum.accumulate(angles - angles[0])
    at = lambda f: np.interp(f, np.arange(n), angles)
    print(f"profile at frame {p1:.0f} ({at(p1):.0f} deg), back {back:.0f} ({at(back):.0f}), profile {p2:.0f} ({at(p2):.0f}), last {angles[-1]:.0f}")
    return angles


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--still", type=Path, help="front-view still for the static fallback")
    ap.add_argument("--frames", type=int, default=120)
    ap.add_argument("--height", type=int, default=800, help="large frame height in px")
    ap.add_argument("--atlas-height", type=int, default=256, help="frame height on the sheet in px")
    args = ap.parse_args()

    # Pass 1: silhouette bounds.
    boxes, bg = [], None
    for rgb in video_frames(args.video):
        if bg is None:
            bg = background(rgb)
        boxes.append(bounds(silhouette(rgb, bg)[2]))
    boxes = np.array(boxes, dtype=np.float64)
    n = len(boxes)
    angles = measure_angles(boxes[:, 1] - boxes[:, 0])

    steps = np.arange(args.frames) * 360 / args.frames
    error = np.abs((angles[None, :] - steps[:, None] + 180) % 360 - 180)
    picks = error.argmin(axis=1)
    print(f"{n} video frames -> {args.frames} steps, worst angle error {error.min(axis=1).max():.1f} deg")

    # One crop for every frame, centred on the turntable axis: midway between
    # the silhouette centres of opposite views.
    centers = (boxes[:, 0] + boxes[:, 1]) / 2
    half_turn = angles <= 180
    opposite = np.interp(angles[half_turn] + 180, angles, centers)
    axis = np.median((centers[half_turn] + opposite) / 2)
    top, bottom = boxes[:, 2].min(), boxes[:, 3].max()
    pad = 0.02 * (bottom - top)
    half = max(axis - boxes[:, 0].min(), boxes[:, 1].max() - axis) + pad
    box = tuple(int(round(v)) for v in (axis - half, top - pad, axis + half, bottom + pad))
    aspect = (box[2] - box[0]) / (box[3] - box[1])
    size = (2 * round(args.height * aspect / 2), args.height)
    cell = (2 * round(args.atlas_height * aspect / 2), args.atlas_height)
    cols = int(np.ceil(np.sqrt(args.frames * cell[1] / cell[0])))
    rows = int(np.ceil(args.frames / cols))
    atlas = Image.new("RGBA", (cols * cell[0], rows * cell[1]))

    # Pass 2: cut out and crop the picked frames.
    dest = OUT / "turntable"
    for old in dest.rglob("*.webp"):
        old.unlink()
    (dest / "frames").mkdir(parents=True, exist_ok=True)
    wanted = {}
    for k, i in enumerate(picks):
        wanted.setdefault(int(i), []).append(k)
    digest = hashlib.sha1()
    large = 0
    for i, rgb in enumerate(video_frames(args.video)):
        if i not in wanted:
            continue
        frame = cut_out(rgb, bg)[0].crop(box)
        im, small = frame.resize(size, Image.LANCZOS), frame.resize(cell, Image.LANCZOS)
        for k in wanted[i]:
            path = dest / "frames" / f"{k:03d}.webp"
            im.save(path, "WEBP", quality=80, alpha_quality=90, method=6)
            digest.update(path.read_bytes())
            large += path.stat().st_size
            atlas.paste(small, ((k % cols) * cell[0], (k // cols) * cell[1]))
    atlas.save(dest / "atlas.webp", "WEBP", quality=82, alpha_quality=90, method=6)
    digest.update((dest / "atlas.webp").read_bytes())

    span = box[3] - box[1]
    manifest = {
        "version": digest.hexdigest()[:8],
        "frames": args.frames,
        "width": size[0],
        "height": size[1],
        "atlas": {"cols": cols, "rows": rows, "width": atlas.width, "height": atlas.height},
        "garment": [round(float(top - box[1]) / span, 4), round(float(bottom - box[1]) / span, 4)],
    }
    (dest / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(
        f"axis x={axis:.0f}px; wrote {args.frames} frames at {size[0]}x{size[1]} ({large / 1e6:.1f} MB) and a "
        f"{cols}x{rows} sheet of {cell[0]}x{cell[1]} ({(dest / 'atlas.webp').stat().st_size / 1e3:.0f} KB)"
    )

    if args.still:
        rgb = np.asarray(Image.open(args.still).convert("RGB"))
        im, solid = cut_out(rgb, background(rgb))
        x0, x1, y0, y1 = bounds(solid)
        m = int(0.02 * (y1 - y0))
        im = im.crop((x0 - m, y0 - m, x1 + m, y1 + m))
        if im.height > 1200:
            im = im.resize((round(im.width * 1200 / im.height), 1200), Image.LANCZOS)
        im.save(OUT / "jacket.webp", "WEBP", quality=82, alpha_quality=90, method=6)
        print(f"wrote jacket.webp at {im.width}x{im.height}, {(OUT / 'jacket.webp').stat().st_size / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
