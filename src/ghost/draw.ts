import { BEHAVIOUR as B, COLORS as C } from "./config";
import { drawEyes } from "./eyes";
import { TAU, rgba } from "./math";
import { makePath, outline, toScreen, trace } from "./outline";
import type { Pt } from "./math";
import type { View, World } from "./state";

/** The faint background pattern: rows of overlapping circles, every other row shifted by half a circle. */
export function buildPattern(view: View): HTMLCanvasElement {
  const { W, H, DPR } = view;
  const pat = document.createElement("canvas");
  pat.width = W * DPR;
  pat.height = H * DPR;
  const g = pat.getContext("2d");
  if (!g) return pat;
  g.scale(DPR, DPR);
  const r = Math.min(W, H) * 0.16;
  g.strokeStyle = rgba(C.pattern, 1);
  g.lineWidth = 1;
  for (let y = -r; y < H + r; y += r * 0.9)
    for (
      let x = -r + (Math.round(y / (r * 0.9)) % 2 ? r * 0.5 : 0);
      x < W + r;
      x += r
    ) {
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.stroke();
    }
  return pat;
}

const rg = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stops: [number, string][],
) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
};

function star4(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.3 : r,
      a = (i / 8) * TAU;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** One frame, back to front: background, floor glow, ripples, the glass body, eyes, sparkles, z's. */
export function draw(w: World) {
  const { ctx, ghost: G, t } = w;
  const { W, H, DPR, U } = w.view;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  // floor glow: a flattened radial gradient that fades as the ghost hops
  const fl = G.y + U * 0.66;
  ctx.save();
  ctx.translate(G.x, fl + G.lift * 0.2);
  ctx.scale(1, 0.14);
  ctx.fillStyle = rg(ctx, 0, 0, U * 0.5, [
    [0, rgba(C.shadow, 0.22 - (0.1 * G.lift) / U)],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.beginPath();
  ctx.arc(0, 0, U * 0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
  // ripples: a big ring around the ghost on a click, a small one where you click elsewhere
  for (const r of w.rips) {
    const u = r.t / B.rippleLife,
      rad = (r.big ? U * 0.55 : U * 0.06) + u * U * (r.big ? 0.9 : 0.5);
    ctx.lineWidth = (r.big ? 2 : 1.4) * (1 - u) + 0.4;
    ctx.strokeStyle = rgba(C.ripple, (1 - u) ** 2 * (r.big ? 0.55 : 0.4));
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, TAU);
    ctx.stroke();
  }
  // body
  const loc = outline(G, t),
    scr = toScreen(G, U, loc);
  w.path = makePath(scr.map((p): Pt => [p[0] * DPR, p[1] * DPR]));
  const ph = G.surp,
    split = U * (0.018 + 0.05 * ph + 0.02 * G.press);
  // startled: the body flickers (not with reduced motion)
  const alpha =
    1 - 0.45 * ph * (w.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 40));
  // chromatic aura: cyan, magenta and violet copies, blurred and offset; the offset widens when startled
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.12}px)`;
  ctx.translate(-split * 1.4, split * 0.5);
  ctx.fillStyle = rgba(C.auraCyan, 0.42 + 0.15 * G.glow);
  trace(ctx, scr);
  ctx.fill();
  ctx.translate(split * 2.8, -split);
  ctx.fillStyle = rgba(C.auraMagenta, 0.36 + 0.15 * G.glow);
  trace(ctx, scr);
  ctx.fill();
  ctx.translate(-split * 1.4, split * 0.5);
  ctx.filter = `blur(${U * 0.2}px)`;
  ctx.fillStyle = rgba(C.auraViolet, 0.38 + 0.2 * G.glow);
  trace(ctx, scr);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = alpha;
  // RGB-split edges (sharp-ish)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.012}px)`;
  ctx.translate(-split, 0);
  ctx.strokeStyle = rgba(C.edgeCyan, 0.55);
  ctx.lineWidth = U * 0.012;
  trace(ctx, scr);
  ctx.stroke();
  ctx.translate(split * 2, 0);
  ctx.strokeStyle = rgba(C.edgeMagenta, 0.5);
  trace(ctx, scr);
  ctx.stroke();
  ctx.restore();
  // fill, clipped to the body
  ctx.save();
  trace(ctx, scr);
  ctx.clip();
  const top = G.y - U * 0.5,
    bot = G.y + U * 0.5;
  const lg = ctx.createLinearGradient(G.x - U * 0.4, top, G.x + U * 0.4, bot);
  lg.addColorStop(0, C.bodyTop);
  lg.addColorStop(0.5, C.bodyMid);
  lg.addColorStop(1, C.bodyBottom);
  ctx.fillStyle = lg;
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = rg(ctx, G.x + U * 0.22, G.y + U * 0.25, U * 0.55, [
    [0, rgba(C.innerMagenta, 0.42 + 0.2 * G.glow)],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.fillStyle = rg(ctx, G.x - U * 0.26, G.y - U * 0.25, U * 0.55, [
    [0, rgba(C.innerBlue, 0.45 + 0.2 * G.glow)],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.fillStyle = rg(ctx, G.x + U * 0.32, G.y - U * 0.1, U * 0.4, [
    [0, rgba(C.innerTeal, 0.22)],
    [1, "rgba(0,0,0,0)"],
  ]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = rg(ctx, G.x - U * 0.05, G.y - U * 0.02, U * 0.5, [
    [0, rgba(C.core, 0.55)],
    [0.7, rgba(C.core, 0.15)],
    [1, rgba(C.core, 0)],
  ]);
  ctx.fillRect(G.x - U, G.y - U, U * 2, U * 2);
  // scanlines, drifting down
  ctx.globalAlpha = alpha * 0.07;
  ctx.fillStyle = C.scanline;
  const step = Math.max(3, U * 0.012);
  const off = (t * U * 0.04) % step;
  for (let y = top - step + off; y < bot + U * 0.2; y += step)
    ctx.fillRect(G.x - U, y, U * 2, Math.max(1, step * 0.35));
  ctx.globalAlpha = alpha;
  // inner edge glow
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = `blur(${U * 0.05}px)`;
  ctx.lineWidth = U * 0.12;
  const eg = ctx.createLinearGradient(G.x - U * 0.4, top, G.x + U * 0.4, bot);
  eg.addColorStop(0, rgba(C.rimTop, 0.65));
  eg.addColorStop(0.5, rgba(C.rimMid, 0.25));
  eg.addColorStop(1, rgba(C.rimBottom, 0.55));
  ctx.strokeStyle = eg;
  trace(ctx, scr);
  ctx.stroke();
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  // inner ring: the outline inset to 90%, glowing
  const inset = toScreen(
    G,
    U,
    loc.map(([x, y]): Pt => [x * 0.9, (y + 0.03) * 0.9]),
  );
  const rgd = ctx.createLinearGradient(G.x - U * 0.4, top, G.x + U * 0.35, bot);
  rgd.addColorStop(0, rgba(C.ringTop, 0.85));
  rgd.addColorStop(0.55, rgba(C.ringMid, 0.25));
  rgd.addColorStop(1, rgba(C.ringBottom, 0.55));
  ctx.save();
  ctx.shadowColor = rgba(C.ringShadow, 0.8);
  ctx.shadowBlur = U * 0.05;
  ctx.strokeStyle = rgd;
  ctx.lineWidth = U * 0.022;
  trace(ctx, inset);
  ctx.stroke();
  ctx.restore();
  // outer hairline
  ctx.strokeStyle = rgba(C.hairline, 0.28);
  ctx.lineWidth = 1.2;
  trace(ctx, scr);
  ctx.stroke();
  // specular: a short arc on the top left of the dome
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.rotate(G.lean);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = rgba(C.specular, 0.55);
  ctx.lineWidth = U * 0.022;
  ctx.lineCap = "round";
  ctx.filter = `blur(${U * 0.006}px)`;
  ctx.beginPath();
  ctx.arc(-U * 0.02, -U * 0.08, U * 0.31, Math.PI * 1.12, Math.PI * 1.36);
  ctx.stroke();
  ctx.filter = "none";
  ctx.restore();
  drawEyes(ctx, G, U, w.eyeW);
  ctx.restore();
  // sparkles and z's
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of w.parts) {
    const u = p.t / p.life,
      a = (1 - u) ** 1.4;
    ctx.fillStyle = rgba(p.c, a);
    ctx.shadowColor = rgba(p.c, a);
    ctx.shadowBlur = 10;
    if (p.star) star4(ctx, p.x, p.y, p.s * (1 - u * 0.3), p.rot);
    else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 0.35, 0, TAU);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  for (const z of w.zz) {
    const u = z.t / B.zLife;
    ctx.fillStyle = rgba(C.z, Math.sin(u * Math.PI) * 0.8);
    ctx.font = `600 ${U * (0.07 + u * 0.05)}px system-ui,sans-serif`;
    ctx.fillText(
      "z",
      z.x + Math.sin(z.t * 2) * U * 0.04 + u * U * 0.12,
      z.y - u * U * 0.35,
    );
  }
  ctx.restore();
}
