import { BEHAVIOUR as B } from "./config";
import { burst } from "./update";
import type { World } from "./state";

/**
 * Pointer input. A mouse works like the original: the cursor is the target, hovering the body makes it happy,
 * clicking it squashes it, clicking elsewhere makes it flinch, leaving the window lets it look around.
 * A finger maps onto the same states: the touch point becomes the cursor (and stays where you lift it, so the
 * ghost keeps looking there and falls asleep after 5 s), a finger resting or sliding on the body is the hover,
 * a tap on the body is the click, a tap elsewhere the flinch and a quick swipe the startle.
 * Returns a function that removes the listeners.
 */
export function listen(w: World): () => void {
  const { pointer: M, ghost: G } = w;
  const hitTest = (x: number, y: number) => {
    const { ctx, view } = w;
    if (!w.path) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return ctx.isPointInPath(w.path, x * view.DPR, y * view.DPR);
  };
  // any input while it's asleep makes it start awake: dot eyes and one small hop
  const wake = () => {
    if (G.sleep > 0.5 && !G.woke) {
      G.surp = Math.max(G.surp, 0.7);
      G.liftv += B.wakeHop;
      G.woke = true;
    }
  };
  const onMove = (e: PointerEvent) => {
    const now = performance.now();
    wake();
    M.x = e.clientX;
    M.y = e.clientY;
    M.present = true;
    M.touch = e.pointerType === "touch";
    M.lastMove = now;
  };
  const onDown = (e: PointerEvent) => {
    let hit = G.hover;
    if (e.pointerType === "touch") {
      // a finger lands without a hover first: wake, jump the cursor here (no flick), hit-test the point itself
      wake();
      M.touch = true;
      M.present = true;
      M.px = e.clientX;
      M.py = e.clientY;
      hit = hitTest(e.clientX, e.clientY);
    }
    M.down = true;
    M.x = e.clientX;
    M.y = e.clientY;
    M.lastMove = performance.now();
    if (hit) {
      G.press = 1;
      G.sqv += 7;
      G.liftv += B.clickHop;
      burst(w, M.x, M.y, B.clickSparks);
      w.rips.push({ x: G.x, y: G.y, t: 0, big: true });
    } else {
      w.rips.push({ x: M.x, y: M.y, t: 0, big: false });
      G.surp = Math.max(G.surp, 0.45);
    }
  };
  const onUp = () => {
    M.down = false;
  };
  // the cursor left the window (a lifted finger also "leaves": ignore that, the touch point stays)
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== "touch") M.present = false;
  };
  const onBlur = () => {
    M.present = false;
  };
  addEventListener("pointermove", onMove);
  addEventListener("pointerdown", onDown);
  addEventListener("pointerup", onUp);
  addEventListener("pointercancel", onUp);
  document.addEventListener("pointerleave", onLeave);
  addEventListener("blur", onBlur);
  return () => {
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onDown);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    document.removeEventListener("pointerleave", onLeave);
    removeEventListener("blur", onBlur);
  };
}
