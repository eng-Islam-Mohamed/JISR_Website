import gsap from "gsap";
import { $, $$, reduced } from "./util";

/** Pointer-following light and border glow for [data-spotlight] surfaces. */
export function mountSpotlights() {
  $$(".demo-board, .screen-scene, .faq-list").forEach((el) => el.setAttribute("data-spotlight", ""));
  $$("[data-spotlight]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const b = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - b.left}px`);
      el.style.setProperty("--my", `${e.clientY - b.top}px`);
      el.style.setProperty("--spot", reduced() ? "0.6" : "1");
    });
    el.addEventListener("pointerleave", () => el.style.setProperty("--spot", "0"));
  });
}

/** Gentle 3D tilt toward the pointer (max 5 degrees). */
export function mountTilt() {
  $$(".demo-board, .tile-lang, .download-art img").forEach((el) => {
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
    gsap.set(el, { transformPerspective: 1100 });
    const host = el.closest<HTMLElement>(".download-art") ?? el;
    host.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || reduced()) return;
      const b = host.getBoundingClientRect();
      ry(((e.clientX - b.left) / b.width - 0.5) * 9);
      rx(-((e.clientY - b.top) / b.height - 0.5) * 7);
    });
    host.addEventListener("pointerleave", () => {
      rx(0);
      ry(0);
    });
  });
}

/** Squash on press and an underdamped release, like a liquid glass control. */
export function mountJelly() {
  const selector = ".demo-choice, .showcase-tab, .calm-switch, .speak-button, .language-toggle, .motion-toggle";
  document.addEventListener("pointerdown", (e) => {
    const el = (e.target as Element).closest<HTMLElement>(selector);
    if (!el || reduced() || (el as HTMLButtonElement).disabled) return;
    gsap.to(el, { scaleX: 1.045, scaleY: 0.94, duration: 0.14, ease: "power2.out", overwrite: "auto" });
    const release = () => {
      gsap.to(el, { scaleX: 1, scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.42)", overwrite: "auto" });
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", release);
    };
    addEventListener("pointerup", release);
    addEventListener("pointercancel", release);
  });
}

/** Magnetic pull on secondary actions (mouse only, bounded). */
export function mountMagnets() {
  $$(".motion-toggle, .back-top, .ready-more, .text-link").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (reduced() || e.pointerType !== "mouse") return;
      const b = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - b.left - b.width / 2) * 0.18,
        y: (e.clientY - b.top - b.height / 2) * 0.25,
        duration: 0.3,
      });
    });
    el.addEventListener("pointerleave", () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" }),
    );
  });
}

/** Soft glow that drifts toward the pointer inside the dark manifesto. */
export function mountManifestoGlow() {
  const section = $(".manifesto");
  const glow = $(".manifesto-glow");
  if (!section || !glow) return;
  const xTo = gsap.quickTo(glow, "x", { duration: 1.6, ease: "power3.out" });
  const yTo = gsap.quickTo(glow, "y", { duration: 1.6, ease: "power3.out" });
  section.addEventListener("pointermove", (e) => {
    if (reduced() || e.pointerType !== "mouse") return;
    const b = section.getBoundingClientRect();
    xTo(e.clientX - b.left - glow.offsetWidth / 2);
    yTo(e.clientY - b.top - glow.offsetHeight / 2);
  });
}

/** Spotlight over the closing wordmark. */
export function mountMarkLight() {
  const mark = $(".big-mark");
  if (!mark) return;
  mark.addEventListener("pointermove", (e) => {
    const b = mark.getBoundingClientRect();
    mark.style.setProperty("--mx", `${e.clientX - b.left}px`);
    mark.style.setProperty("--my", `${e.clientY - b.top}px`);
    mark.style.setProperty("--spot", "1");
  });
  mark.addEventListener("pointerleave", () => mark.style.setProperty("--spot", "0"));
}
