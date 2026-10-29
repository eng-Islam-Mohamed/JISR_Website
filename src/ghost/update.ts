import { BEHAVIOUR as B, COLORS } from "./config";
import { eyeWeights } from "./eyes";
import { clamp, lerp, TAU } from "./math";
import type { World } from "./state";

/** Sparkles from (x, y): four-point stars and dots in four colours, flung out, slowing down and falling. */
export function burst(w: World, x: number, y: number, n: number) {
  const U = w.view.U,
    cols = COLORS.sparks;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU,
      v = ((160 + Math.random() * 420) * U) / 340;
    w.parts.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      t: 0,
      life: 0.6 + Math.random() * 0.6,
      s: ((2 + Math.random() * 5) * U) / 340,
      c: cols[i % 4],
      rot: Math.random() * TAU,
      vr: (Math.random() - 0.5) * 8,
      star: Math.random() < 0.55,
    });
  }
}

/** One step of the simulation. dt in seconds (0.001…0.033). */
export function update(w: World, dt: number) {
  const { ctx, pointer: M, ghost: G } = w;
  const { W, H, DPR, U, CX, CY } = w.view;
  w.t += dt;
  const t = w.t,
    now = performance.now();
  // target: the cursor, or a slow figure-of-eight wander when there's none
  let tx: number, ty: number;
  if (M.present) {
    tx = M.x;
    ty = M.y;
  } else {
    tx = CX + Math.cos(t * 0.4) * W * 0.3;
    ty = CY + Math.sin(t * 0.55) * H * 0.2;
  }
  const sp = dt > 0 ? Math.hypot(M.x - M.px, M.y - M.py) / dt : 0;
  M.spd = lerp(
    Number.isFinite(M.spd) ? M.spd : 0,
    M.present && Number.isFinite(sp) ? sp : 0,
    0.3,
  );
  M.px = M.x;
  M.py = M.y;
  // idle → sleep
  const idle = (now - M.lastMove) / 1000,
    drowsy = idle > B.sleepAfter;
  G.sleep = lerp(
    G.sleep,
    M.present && drowsy && !G.hover ? 1 : 0,
    1 - Math.exp(-dt * (drowsy ? 1.2 : 6)),
  );
  if (G.sleep <= 0.5) G.woke = false;
  // the body drifts a little toward the cursor and bobs (less when asleep)
  const dx = tx - CX,
    dy = ty - CY,
    dl = Math.hypot(dx, dy) || 1;
  const bx = CX + clamp(dx * 0.06, -U * 0.16, U * 0.16),
    by =
      CY +
      clamp(dy * 0.04, -U * 0.1, U * 0.1) +
      Math.sin(t * 1.5) * U * 0.035 * (1 - 0.6 * G.sleep) -
      G.lift;
  G.vx += ((bx - G.x) * 28 - G.vx * 7.5) * dt;
  G.vy += ((by - G.y) * 28 - G.vy * 7.5) * dt;
  G.x += G.vx * dt;
  G.y += G.vy * dt;
  // the hem trails behind the velocity
  const tvx = clamp((-G.vx / U) * 0.22, -0.22, 0.22),
    tvy = clamp((-G.vy / U) * 0.12, -0.1, 0.1);
  G.trailX = lerp(G.trailX, tvx, 1 - Math.exp(-dt * 6));
  G.trailY = lerp(G.trailY, tvy, 1 - Math.exp(-dt * 6));
  // lean into the motion and toward the cursor's side
  G.lv +=
    (clamp((G.vx / U) * 0.12, -0.16, 0.16) +
      clamp((dx / W) * 0.12, -0.06, 0.06) -
      G.lean) *
      60 *
      dt -
    G.lv * 9 * dt;
  G.lean += G.lv * dt;
  // hover: the cursor inside last frame's outline (a finger only while it's down)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  G.hover = !!(
    w.path &&
    M.present &&
    (!M.touch || M.down) &&
    ctx.isPointInPath(w.path, M.x * DPR, M.y * DPR)
  );
  G.happy = lerp(
    G.happy,
    G.hover ? 1 : 0,
    1 - Math.exp(-dt * (G.hover ? 8 : 5)),
  );
  G.glow = lerp(G.glow, G.hover ? 1 : 0, 1 - Math.exp(-dt * 4));
  // startle on a fast cursor
  if (M.spd > (B.startleSpeed * U) / 340 && !G.hover && G.surp < 0.6) {
    G.surp = 1;
    G.liftv += B.startleHop;
    burst(w, G.x, G.y - U * 0.1, B.startleSparks);
  }
  G.surp = Math.max(0, G.surp - dt * (G.hover ? 4 : 1.3));
  G.press = Math.max(0, G.press - dt * 2.6);
  eyeWeights(w.eyeW, w.eyeV, G, dt);
  // gaze: a spring toward the cursor's direction, full strength from 1.2 U away
  const gm = Math.min(1, dl / (U * 1.2));
  springEye(w, (dx / dl) * gm, (dy / dl) * gm * 0.85, dt);
  // jelly + hop
  G.sqv += (-G.sq * 200 - G.sqv * 8) * dt;
  G.sq += G.sqv * dt;
  G.liftv -= B.gravity * dt * (U / 340);
  G.lift += G.liftv * dt;
  if (G.lift < 0) {
    if (G.liftv < -150) G.sqv += Math.min(6, -G.liftv * 0.012); // a hard landing squashes it
    G.lift = 0;
    G.liftv = 0;
  }
  G.phase += dt * (2.4 + (Math.abs(G.vx) / U) * 3) * (1 - 0.6 * G.sleep);
  // blink, only with plain open eyes
  G.nextBlink -= dt;
  if (
    G.nextBlink <= 0 &&
    G.happy < 0.3 &&
    G.press < 0.1 &&
    G.surp < 0.2 &&
    G.sleep < 0.3
  ) {
    G.blinkT = 0;
    G.nextBlink = B.blinkGap[0] + Math.random() * B.blinkGap[1];
  }
  if (G.blinkT >= 0) {
    G.blinkT += dt;
    const u = G.blinkT / B.blinkLength;
    G.blink = u < 0.5 ? u * 2 : Math.max(0, 2 - u * 2);
    if (u >= 1) {
      G.blinkT = -1;
      G.blink = 0;
    }
  }
  // particles, ripples, z's
  for (const p of w.parts) {
    p.t += dt;
    p.vx *= Math.exp(-2.8 * dt);
    p.vy = p.vy * Math.exp(-2.8 * dt) + 40 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  for (let i = w.parts.length - 1; i >= 0; i--)
    if (w.parts[i].t > w.parts[i].life) w.parts.splice(i, 1);
  for (const r of w.rips) r.t += dt;
  for (let i = w.rips.length - 1; i >= 0; i--)
    if (w.rips[i].t > B.rippleLife) w.rips.splice(i, 1);
  if (G.sleep > 0.8 && Math.random() < dt * B.zRate)
    w.zz.push({ x: G.x + U * 0.32, y: G.y - U * 0.4, t: 0 });
  for (const z of w.zz) z.t += dt;
  for (let i = w.zz.length - 1; i >= 0; i--)
    if (w.zz[i].t > B.zLife) w.zz.splice(i, 1);
}

function springEye(w: World, tx: number, ty: number, dt: number) {
  const G = w.ghost;
  G.gvx += ((tx - G.gx) * 150 - G.gvx * 17) * dt;
  G.gvy += ((ty - G.gy) * 150 - G.gvy * 17) * dt;
  G.gx += G.gvx * dt;
  G.gy += G.gvy * dt;
}
