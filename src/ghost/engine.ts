import { buildPattern, draw } from "./draw";
import { listen } from "./input";
import { createWorld, type View } from "./state";
import { update } from "./update";

/** Size from the canvas's own box (the visible viewport on phones), drawn at up to 2× density. */
function measure(canvas: HTMLCanvasElement): View {
  const rect = canvas.getBoundingClientRect();
  const W = rect.width,
    H = rect.height,
    DPR = Math.min(devicePixelRatio || 1, 2);
  return { W, H, DPR, U: Math.min(W, H) * 0.4, CX: W / 2, CY: H * 0.5 };
}

/** Starts the ghost on a full-window canvas. Returns a function that stops it. */
export function startGhost(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const w = createWorld(ctx, measure(canvas));
  const resize = () => {
    const v = measure(canvas),
      old = w.view;
    if (w.pattern && v.W === old.W && v.H === old.H && v.DPR === old.DPR)
      return; // resizing clears the canvas
    w.view = v;
    canvas.width = v.W * v.DPR;
    canvas.height = v.H * v.DPR;
    w.pattern = buildPattern(v);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  addEventListener("resize", resize);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const onMotion = () => {
    w.reducedMotion = motion.matches;
  };
  onMotion();
  motion.addEventListener("change", onMotion);
  const unlisten = listen(w);
  let last = performance.now();
  let raf = requestAnimationFrame(loop);
  function loop(now: number) {
    const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
    last = now;
    // no size yet (a hidden iframe, a collapsed parent): wait, drawing a 0 × 0 pattern would throw
    if (w.view.W > 0 && w.view.H > 0) {
      update(w, dt);
      draw(w);
    }
    raf = requestAnimationFrame(loop);
  }
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    removeEventListener("resize", resize);
    motion.removeEventListener("change", onMotion);
    unlisten();
  };
}
