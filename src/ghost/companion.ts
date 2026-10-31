import { draw } from "./draw";
import { listen } from "./input";
import { createWorld, type View } from "./state";
import { update, burst } from "./update";

/** Keeps the supplied ghost simulation intact, adapting only its stage to a scrolling website. */
export function mountCompanion(
  canvas: HTMLCanvasElement,
  pet: HTMLButtonElement,
  toggle: HTMLButtonElement,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduced = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.motion === "reduced";
  function measure(): View {
    const W = innerWidth,
      H = innerHeight;
    return {
      W,
      H,
      DPR: Math.min(devicePixelRatio || 1, 1.5),
      U: W < 640 ? 78 : 118,
      CX: W - 90,
      CY: H * 0.43,
    };
  }
  const w = createWorld(ctx, measure());
  let enabled = true,
    frame = 0,
    last = performance.now(),
    dirty = last + 1000;
  const unlisten = listen(w);
  let obstacles: DOMRect[] = [],
    lastScan = 0;
  const overlap = (x: number, y: number, r: DOMRect) =>
    x + w.view.U * 0.55 > r.left &&
    x - w.view.U * 0.55 < r.right &&
    y + w.view.U * 0.6 > r.top &&
    y - w.view.U * 0.6 < r.bottom;
  function scan(now: number) {
    if (now - lastScan < 240) return;
    lastScan = now;
    obstacles = [
      ...document.querySelectorAll<HTMLElement>(
        "h1 .cinema-word,h2 .cinema-word,.cinema-lead,.ready-lead,.cinema-actions,.cinema-ready>.ink,.header,.button,.speak-button,main h2,.step-copy h3,.showcase-tab,.tile-copy,.demo-board,.faq-list summary,.download-copy",
      ),
    ]
      .filter(
        (el) =>
          getComputedStyle(el).visibility !== "hidden" &&
          !el.closest('[aria-hidden="true"]'),
      )
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.bottom > 0 && r.top < innerHeight);
  }
  function safeTarget(x: number, y: number) {
    const { W, H, U } = w.view;
    const clamp = (a: number, min: number, max: number) =>
      Math.max(min, Math.min(max, a));
    const bound = (px: number, py: number) => ({
      x: clamp(px, U * 0.7, W - U * 0.7),
      y: clamp(py, U * 0.8, H - U * 0.8),
    });
    let choices = [bound(x, y)];
    for (const r of obstacles)
      if (overlap(x, y, r))
        choices.push(
          bound(r.left - U * 0.7, y),
          bound(r.right + U * 0.7, y),
          bound(x, r.top - U * 0.8),
          bound(x, r.bottom + U * 0.8),
        );
    return choices.sort((a, b) => {
      const cost = (p: { x: number; y: number }) =>
        obstacles.filter((r) => overlap(p.x, p.y, r)).length * 1e6 +
        (p.x - x) ** 2 +
        (p.y - y) ** 2;
      return cost(a) - cost(b);
    })[0];
  }

  function resize() {
    const v = measure();
    w.view = {
      ...v,
      CX: Math.min(w.view.CX, v.W - 60),
      CY: Math.min(w.view.CY, v.H - 80),
    };
    canvas.width = Math.round(v.W * v.DPR);
    canvas.height = Math.round(v.H * v.DPR);
    dirty = performance.now() + 500;
    request();
  }
  function request() {
    if (!frame && enabled && !document.hidden)
      frame = requestAnimationFrame(loop);
  }
  function loop(now: number) {
    frame = 0;
    if (!enabled || document.hidden) return;
    const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
    last = now;
    const { W, H, U } = w.view;
    w.reducedMotion = reduced();
    scan(now);
    if (!w.reducedMotion) {
      const px = w.pointer.present
        ? w.pointer.x + (w.pointer.x > W * 0.65 ? -85 : 85)
        : W - (W < 640 ? 65 : 110);
      const py = w.pointer.present
        ? w.pointer.y + 45
        : H *
          (0.4 +
            Math.min(
              scrollY / Math.max(1, document.documentElement.scrollHeight - H),
              1,
            ) *
              0.25);
      const target = safeTarget(px, py);
      if (
        !w.ghost.hover ||
        obstacles.some((r) => overlap(w.ghost.x, w.ghost.y, r))
      ) {
        w.view.CX += (target.x - w.view.CX) * (1 - Math.exp(-dt * 2.7));
        w.view.CY += (target.y - w.view.CY) * (1 - Math.exp(-dt * 2.7));
      }
    } else {
      w.view.CX = W - 70;
      w.view.CY = H * 0.45;
      w.t = 0;
      w.ghost.phase = 0;
      w.ghost.lift = 0;
      w.ghost.liftv = 0;
      w.parts.length = 0;
      w.rips.length = 0;
      w.zz.length = 0;
    }
    update(w, dt);
    if (w.reducedMotion) {
      w.ghost.x = w.view.CX;
      w.ghost.y = w.view.CY;
      w.ghost.sq = 0;
      w.ghost.lean = 0;
      w.ghost.phase = 0;
    }
    // Hops are bounded on the smaller, integrated companion stage.
    w.ghost.lift = Math.min(w.ghost.lift, U * 0.65);
    w.ghost.x = Math.max(U * 0.55, Math.min(W - U * 0.55, w.ghost.x));
    w.ghost.y = Math.max(U * 0.65, Math.min(H - U * 0.65, w.ghost.y));
    const obscures = obstacles.some((r) => overlap(w.ghost.x, w.ghost.y, r));
    canvas.style.opacity = obscures ? "0.25" : "1";
    pet.style.pointerEvents = obscures ? "none" : "auto";
    draw(w);
    pet.style.transform = `translate(${w.ghost.x - U * 0.5}px,${w.ghost.y - U * 0.55}px)`;
    pet.style.width = `${U}px`;
    pet.style.height = `${U * 1.1}px`;
    canvas.dataset.expression =
      w.ghost.press > 0.4
        ? "press"
        : w.ghost.happy > 0.3
          ? "happy"
          : w.ghost.sleep > 0.5
            ? "sleep"
            : w.ghost.surp > 0.3
              ? "surprise"
              : "open";
    if (!w.reducedMotion || now < dirty) request();
  }
  const wake = () => {
    dirty = performance.now() + 700;
    last = performance.now();
    request();
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    w.ghost.press = 1;
    w.ghost.sqv += 7;
    w.ghost.liftv += 150;
    if (!reduced()) {
      burst(w, w.ghost.x, w.ghost.y, 26);
      w.rips.push({ x: w.ghost.x, y: w.ghost.y, t: 0, big: true });
    }
    wake();
  };
  const toggleGhost = () => {
    enabled = !enabled;
    toggle.setAttribute("aria-pressed", String(enabled));
    canvas.hidden = !enabled;
    pet.hidden = !enabled;
    if (enabled) wake();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  };
  pet.addEventListener("keydown", key);
  toggle.addEventListener("click", toggleGhost);
  addEventListener("pointermove", wake, { passive: true });
  addEventListener("pointerdown", wake, { passive: true });
  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  const observer = new MutationObserver(wake);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", wake);
  resize();
  return () => {
    cancelAnimationFrame(frame);
    unlisten();
    observer.disconnect();
    media.removeEventListener("change", wake);
    removeEventListener("pointermove", wake);
    removeEventListener("pointerdown", wake);
    removeEventListener("scroll", wake);
    removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    pet.removeEventListener("keydown", key);
    toggle.removeEventListener("click", toggleGhost);
  };
}
