import { COLORS } from "./config";
import { clamp, lerp, rgba, type Pt } from "./math";
import type { Ghost } from "./state";

// Every expression is a closed outline with the same number of points (EN), anchored at its top, so any mix of
// them is a valid shape: the eyes morph from one expression into the next by blending point lists.
const EN = 72;

export type Expression =
  "pill" | "closed" | "happy" | "press" | "surprise" | "sleep";
export type EyeWeights = {
  happy: number;
  press: number;
  surprise: number;
  sleep: number;
  closed: number;
};
type EyeSet = Record<Expression, Pt[]>;
type EyeCache = { u: number; sides: Record<-1 | 1, EyeSet> };

/** The outline of a thick polyline with round caps. */
function capsuleLine(pts: Pt[], th: number): Pt[] {
  const L: Pt[] = [],
    R: Pt[] = [],
    n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0],
      ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    L.push([pts[i][0] - (ty * th) / 2, pts[i][1] + (tx * th) / 2]);
    R.push([pts[i][0] + (ty * th) / 2, pts[i][1] - (tx * th) / 2]);
  }
  const cap = (p: Pt, from: number) => {
    const o: Pt[] = [];
    for (let k = 1; k < 12; k++) {
      const ang = from + (k / 12) * Math.PI;
      o.push([
        p[0] + (Math.cos(ang) * th) / 2,
        p[1] + (Math.sin(ang) * th) / 2,
      ]);
    }
    return o;
  };
  const e = pts[n - 1],
    e2 = pts[n - 2],
    s0 = pts[0],
    s1 = pts[1];
  const ae = Math.atan2(e[1] - e2[1], e[0] - e2[0]),
    as = Math.atan2(s0[1] - s1[1], s0[0] - s1[0]);
  return [
    ...R,
    ...cap(e, ae - Math.PI / 2),
    ...L.reverse(),
    ...cap(s0, as - Math.PI / 2),
  ];
}

/** Clockwise, starting at the top, N points evenly spaced along the perimeter. */
function resample(poly: Pt[], N: number): Pt[] {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  if (area < 0) poly = poly.slice().reverse();
  // anchor: the topmost point (closest to straight up from the centroid)
  let cx = 0,
    cy = 0;
  poly.forEach((p) => {
    cx += p[0];
    cy += p[1];
  });
  cx /= poly.length;
  cy /= poly.length;
  let best = 0,
    bv = -1e9;
  poly.forEach((p, i) => {
    const v = -(p[1] - cy) - Math.abs(p[0] - cx) * 0.35;
    if (v > bv) {
      bv = v;
      best = i;
    }
  });
  poly = [...poly.slice(best), ...poly.slice(0, best)];
  const seg: number[] = [];
  let tot = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push(l);
    tot += l;
  }
  const out: Pt[] = [];
  let i = 0,
    acc = 0;
  for (let k = 0; k < N; k++) {
    const d = (k / N) * tot;
    while (acc + seg[i] < d) {
      acc += seg[i];
      i++;
    }
    const u = (d - acc) / (seg[i] || 1),
      a = poly[i],
      b = poly[(i + 1) % poly.length];
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return out;
}

const curve = (f: (t: number) => Pt, n = 16) =>
  [...Array(n)].map((_, i) => f(i / (n - 1)));

/** The six expressions for each eye (side −1 = left, 1 = right), in px for this U. */
function buildEyes(u: number): Record<-1 | 1, EyeSet> {
  const mk = (pts: Pt[], th: number) => resample(capsuleLine(pts, th), EN);
  const one = (side: -1 | 1): EyeSet => {
    const k = u * 0.046;
    return {
      pill: mk(
        [
          [0, -u * 0.055],
          [0, u * 0.055],
        ],
        u * 0.072,
      ), // open: an upright capsule
      closed: mk(
        curve((t) => [
          lerp(-u * 0.05, u * 0.05, t),
          u * 0.012 * Math.sin(t * Math.PI),
        ]),
        u * 0.026,
      ),
      happy: mk(
        curve((t) => {
          const x = lerp(-u * 0.058, u * 0.058, t);
          return [x, u * 0.03 - u * 0.075 * Math.sin(t * Math.PI)];
        }),
        u * 0.034,
      ), // ^ arch
      press: mk(
        [
          [side * k, -k],
          [side * k * 0.4, -k * 0.45],
          [-side * k * 0.8, 0],
          [side * k * 0.4, k * 0.45],
          [side * k, k],
        ],
        u * 0.032,
      ), // > and <
      surprise: resample(
        curve(
          (t) => [
            Math.cos(t * Math.PI * 2) * u * 0.058,
            Math.sin(t * Math.PI * 2) * u * 0.058,
          ],
          48,
        ).slice(0, 47),
        EN,
      ), // round dot
      sleep: mk(
        curve((t) => [
          lerp(-u * 0.05, u * 0.05, t),
          u * 0.02 + u * 0.024 * Math.sin(t * Math.PI),
        ]),
        u * 0.024,
      ),
    };
  };
  return { [-1]: one(-1), [1]: one(1) } as Record<-1 | 1, EyeSet>;
}

/**
 * Springs each expression weight toward its target: stiff for blinks and presses, slow for sleep. The blink spring
 * (stiffness 900) is only stable for steps under ~0.029 s, so slow frames (30 fps phones) are split into steps of
 * 0.02 s at most; at 60 fps and above it's one step.
 */
export function eyeWeights(W: EyeWeights, V: EyeWeights, G: Ghost, dt: number) {
  const T: EyeWeights = {
    happy: G.hover ? 1 : 0,
    press: G.press > 0.4 ? 1 : 0,
    surprise: G.hover ? 0 : clamp(G.surp * 1.6, 0, 1),
    sleep: G.sleep > 0.5 && !G.hover ? 1 : 0,
    closed: G.blink,
  };
  const K: EyeWeights = {
    happy: 170,
    press: 420,
    surprise: 220,
    sleep: 60,
    closed: 900,
  };
  const n = dt > 0.02 ? Math.ceil(dt / 0.02) : 1,
    h = dt / n;
  for (let i = 0; i < n; i++)
    for (const k of [
      "happy",
      "press",
      "surprise",
      "sleep",
      "closed",
    ] as const) {
      const kk = K[k],
        c = 2 * Math.sqrt(kk) * 0.92;
      V[k] += ((T[k] - W[k]) * kk - V[k] * c) * h;
      W[k] += V[k] * h;
    }
}

let cache: EyeCache | null = null;

/** Both eyes: a priority blend (press > happy > surprise > sleep > blink > open), offset by the gaze. */
export function drawEyes(
  ctx: CanvasRenderingContext2D,
  G: Ghost,
  U: number,
  EW: EyeWeights,
) {
  if (!cache || cache.u !== U) cache = { u: U, sides: buildEyes(U) };
  const c = Math.cos(G.lean),
    s = Math.sin(G.lean);
  const fx = G.gx * U * 0.075,
    fy = G.gy * U * 0.06;
  for (const side of [-1, 1] as const) {
    const E = cache.sides[side];
    // what's left after each higher-priority expression goes to the next one; the rest is the open pill
    const press = clamp(EW.press, 0, 1.15);
    let rest = 1 - Math.min(1, press);
    const happy = clamp(EW.happy, 0, 1.1) * rest;
    rest *= 1 - Math.min(1, clamp(EW.happy, 0, 1));
    const surprise = clamp(EW.surprise, 0, 1.1) * rest;
    rest *= 1 - Math.min(1, clamp(EW.surprise, 0, 1));
    const sleep = clamp(EW.sleep, 0, 1) * rest;
    rest *= 1 - clamp(EW.sleep, 0, 1);
    const closed = clamp(EW.closed, 0, 1) * rest;
    rest *= 1 - clamp(EW.closed, 0, 1);
    const mix: [Expression, number][] = [
      ["press", press],
      ["happy", happy],
      ["surprise", surprise],
      ["sleep", sleep],
      ["closed", closed],
      ["pill", rest],
    ];
    const pts: Pt[] = [];
    for (let i = 0; i < EN; i++) {
      let x = 0,
        y = 0;
      for (const [k, w] of mix) {
        const p = E[k][i];
        x += p[0] * w;
        y += p[1] * w;
      }
      pts.push([x, y]);
    }
    const lx = side * U * 0.135 + fx,
      ly = -U * 0.1 + fy;
    const ex = G.x + lx * c - ly * s,
      ey = G.y + lx * s + ly * c;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(G.lean);
    ctx.shadowColor = rgba(COLORS.eyeGlow, 0.95);
    ctx.shadowBlur = U * 0.06;
    ctx.fillStyle = COLORS.eye;
    ctx.beginPath();
    const m = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const q = m(pts[EN - 1], pts[0]);
    ctx.moveTo(q[0], q[1]);
    for (let i = 0; i < EN; i++) {
      const a = pts[i],
        b = pts[(i + 1) % EN],
        mm = m(a, b);
      ctx.quadraticCurveTo(a[0], a[1], mm[0], mm[1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
