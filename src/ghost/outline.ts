import { lerp, sstep, type Pt } from "./math";
import type { Ghost } from "./state";

/**
 * The body outline in local units (height ≈ 1, origin at the centre, y down): a half-circle dome, slightly bulging
 * sides and a wavy hem, 136 points. The hem trails behind the ghost's velocity, the lower body sways, and the jelly
 * squash widens and flattens it around the hem line.
 */
export function outline(G: Ghost, t: number): Pt[] {
  const w = 0.43,
    top = -0.48,
    sideY = -0.07,
    hem = 0.42,
    pts: Pt[] = [];
  // four scallops: rounded lobes (s^0.7) with shallow notches between them (−0.35·s^1.6), travelling with G.phase
  const hemWave = (u: number) => {
    const k = 4;
    const s = Math.sin(u * Math.PI * k + G.phase);
    return 0.065 * (s > 0 ? Math.pow(s, 0.7) : -Math.pow(-s, 1.6) * 0.35);
  };
  // dome, left → right over the top
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI + (i / 40) * Math.PI;
    pts.push([Math.cos(a) * w, sideY + Math.sin(a) * (sideY - top)]);
  }
  // right side, down
  for (let i = 1; i <= 18; i++) {
    const v = i / 18;
    pts.push([w * (1 + 0.035 * Math.sin(v * Math.PI)), lerp(sideY, hem, v)]);
  }
  // hem, right → left
  for (let i = 1; i <= 60; i++) {
    const u = i / 60;
    const x = lerp(w, -w, u);
    pts.push([x, hem + hemWave(u)]);
  }
  // left side, up
  for (let i = 1; i < 18; i++) {
    const v = 1 - i / 18;
    pts.push([-w * (1 + 0.035 * Math.sin(v * Math.PI)), lerp(sideY, hem, v)]);
  }
  // deform: trailing, sway, squash
  const sx = 1 + G.sq * 0.9,
    sy = 1 - G.sq * 0.75;
  return pts.map(([x, y]) => {
    const f = sstep(-0.15, 0.5, y);
    x += G.trailX * f * f + Math.sin(t * 2.1 + y * 5) * 0.012 * f;
    y += G.trailY * f * 0.5;
    return [x * sx, (y - 0.42) * sy + 0.42];
  });
}

/** Local units → screen px: rotate by the lean, scale by U (4% bigger when happy), move to the ghost. */
export function toScreen(G: Ghost, U: number, pts: Pt[]): Pt[] {
  const c = Math.cos(G.lean),
    s = Math.sin(G.lean),
    sc = U * (1 + 0.04 * G.happy);
  return pts.map(([x, y]) => [
    G.x + (x * c - y * s) * sc,
    G.y + (x * s + y * c) * sc,
  ]);
}

/** A smooth closed path through the midpoints, with the points as quadratic control points. */
export function trace(ctx: CanvasRenderingContext2D, p: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(
    (p[0][0] + p[p.length - 1][0]) / 2,
    (p[0][1] + p[p.length - 1][1]) / 2,
  );
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length];
    ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  ctx.closePath();
}

/** The polygon as a Path2D, for hover hit tests. */
export function makePath(p: Pt[]) {
  const P = new Path2D();
  P.moveTo(p[0][0], p[0][1]);
  for (const q of p) P.lineTo(q[0], q[1]);
  P.closePath();
  return P;
}
