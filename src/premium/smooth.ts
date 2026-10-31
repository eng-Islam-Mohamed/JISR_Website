import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "../vendor/lenis.mjs";
import { root } from "./util";

let lenis: Lenis | undefined;
const tick = (time: number) => lenis?.raf(time * 1000);
const loading = () => root.dataset.cinemaLoading === "true";

/** Inertial wheel scrolling (Lenis). Touch keeps native scrolling. */
export function startSmooth() {
  if (lenis) return lenis;
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.95, autoRaf: false });
  lenis.on("scroll", () => ScrollTrigger.update());
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  if (loading()) lenis.stop();
  Object.defineProperty(window, "__lenis", { value: lenis, configurable: true });
  return lenis;
}

export function stopSmooth() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  gsap.ticker.lagSmoothing(500, 33);
  lenis.destroy();
  lenis = undefined;
  Object.defineProperty(window, "__lenis", { value: undefined, configurable: true });
}

export const getLenis = () => lenis;

/** Smooth in-page anchors that still move keyboard focus to the target. */
export function mountAnchors() {
  new MutationObserver(() => {
    if (!lenis) return;
    if (loading()) lenis.stop();
    else lenis.start();
  }).observe(root, { attributes: true, attributeFilter: ["data-cinema-loading"] });

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.classList.contains("skip")) return;
    const id = link.getAttribute("href")!.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (id && !target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target ?? 0, { offset: target ? -88 : 0, duration: 1.3 });
    else if (target) target.scrollIntoView();
    else scrollTo(0, 0);
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
}
