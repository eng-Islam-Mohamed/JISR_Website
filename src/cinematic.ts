import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  quadToMatrix3d,
  rectQuad,
  lerpQuad,
  scaleQuad,
  segment,
  type Quad,
} from "./quad";
import { mountCompanion } from "./ghost/companion";
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const optics = getComputedStyle(root);
const CARD_WIDTH = parseFloat(optics.getPropertyValue("--cinema-card-width"));
const CARD_HEIGHT = parseFloat(optics.getPropertyValue("--cinema-card-height"));
const blur = {
  nav: optics.getPropertyValue("--cinema-blur-nav").trim(),
  text: optics.getPropertyValue("--cinema-blur-text").trim(),
  word: optics.getPropertyValue("--cinema-blur-word").trim(),
  arrival: optics.getPropertyValue("--cinema-blur-arrival").trim(),
};
let intro: gsap.core.Timeline | undefined;
const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  root.dataset.motion === "reduced";
const copy = {
  ar: {
    badge: "مساحة صغيرة. تعبير بلا حدود.",
    line1: "لكل تعبير،",
    line2: "جسر.",
    lead: "بعض الكلمات تبدأ بصورة. جسر يساعدك على التعبير عمّا تحتاجه وتشعر به، بطريقتك وبإيقاعك.",
    explore: "اكتشف جسر",
    download: "التحميل قريبًا",
    first: "تواصل بطريقتك.",
    second: "واقترب ممّن تحب.",
    ready:
      "من صورة بسيطة إلى عبارة مسموعة. اكتشف مساحة للتواصل تناسبك، باللغة والإيقاع اللذين تختارهما.",
    more: "تابع الاكتشاف ↓",
    pet: "تفاعل مع الرفيق الزجاجي",
    toggle: "إظهار أو إخفاء الرفيق",
    skip: "تخطي المقدمة",
  },
  fr: {
    badge: "Un espace pour s’exprimer.",
    line1: "Vos mots.",
    line2: "Votre chemin.",
    lead: "Parfois, les mots commencent par une image. JISR vous aide à exprimer vos besoins et vos émotions, à votre manière et à votre rythme.",
    explore: "Découvrir JISR",
    download: "Bientôt disponible",
    first: "À votre manière.",
    second: "Un peu plus proches.",
    ready:
      "D’une simple image à une phrase prononcée. Découvrez un espace de communication adapté à votre langue et à votre rythme.",
    more: "Poursuivre la découverte ↓",
    pet: "Interagir avec le compagnon de verre",
    toggle: "Afficher ou masquer le compagnon",
    skip: "Passer l’introduction",
  },
  en: {
    badge: "Room to express yourself.",
    line1: "Your words.",
    line2: "Your way.",
    lead: "Sometimes, words begin with a picture. JISR helps you express what you need and how you feel, in your own way, at your own pace.",
    explore: "Explore JISR",
    download: "Coming soon",
    first: "Connect your way.",
    second: "A little closer.",
    ready:
      "From a simple picture to a spoken phrase. Find a space for communication that follows your language and your pace.",
    more: "Keep exploring ↓",
    pet: "Interact with the glass companion",
    toggle: "Show or hide the companion",
    skip: "Skip introduction",
  },
};
const stage = document.createElement("section");
stage.className = "cinema";
stage.setAttribute("aria-label", "JISR");
stage.innerHTML = `<div class="cinema-pin"><div class="cinema-media"><div class="cinema-photo"><img src="assets/portal/jisr-dawn.png" alt="" width="1562" height="1007" fetchpriority="high"></div></div><div class="cinema-copy"><div class="cinema-title"><p data-copy="badge"></p><h1><span data-copy="line1"></span><span data-copy="line2"></span></h1></div><div class="cinema-actions"><a class="cinema-button light" href="#experience" data-copy="explore"></a><button type="button" class="cinema-button outline" disabled data-copy="download"></button></div><p class="cinema-lead" data-copy="lead"></p><div class="cinema-scroll" aria-hidden="true">↓</div></div><div class="cinema-over" aria-hidden="true"><div class="portal-plane"><div class="portal-fill"></div><div class="portal-rim"></div></div><div class="portal-light"><img src="assets/jisr-icon.png" alt=""><span>JISR</span><small lang="ar">جسر</small></div></div><section class="cinema-ready" aria-hidden="true" inert><div class="ready-wordmark" aria-hidden="true">JISR</div><h2><span data-copy="first"></span><span data-copy="second"></span></h2><div class="ready-phone"><div class="ready-arrival"><div class="ready-float"><img src="assets/screens/home-ar.png" alt="" width="393" height="852"></div></div></div><p class="ready-lead" data-copy="ready"></p><button type="button" class="cinema-button ink" disabled data-copy="download"></button><a class="ready-more" href="#experience" data-copy="more"></a></section></div>`;
const oldHero = document.querySelector<HTMLElement>(".hero")!;
oldHero.before(stage);
oldHero.hidden = true;
const loader = document.createElement("div");
loader.className = "cinema-loader";
loader.innerHTML =
  '<span class="loader-wordmark" aria-hidden="true">JISR</span><span class="loader-count" aria-live="off">00%</span><button type="button" data-copy="skip"></button>';
document.body.append(loader);
const canvas = document.createElement("canvas");
canvas.className = "ghost-canvas";
canvas.setAttribute("aria-hidden", "true");
const pet = document.createElement("button");
pet.className = "ghost-pet";
pet.type = "button";
const toggle = document.createElement("button");
toggle.className = "ghost-toggle";
toggle.type = "button";
toggle.setAttribute("aria-pressed", "true");
toggle.innerHTML =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V10a7 7 0 0 1 14 0v9l-3-2-4 2-4-2-3 2ZM9 10v2m6-2v2"/></svg>';
document.body.append(canvas, pet, toggle);
const stopGhost = mountCompanion(canvas, pet, toggle);
const header = document.querySelector<HTMLElement>(".header")!;
const photo = stage.querySelector<HTMLElement>(".cinema-photo")!;
const portal = stage.querySelector<HTMLElement>(".portal-plane")!;
const light = stage.querySelector<HTMLElement>(".portal-light")!;
const ready = stage.querySelector<HTMLElement>(".cinema-ready")!;
const heroCopy = stage.querySelector<HTMLElement>(".cinema-copy")!;
let p = 0,
  lastReady = false,
  disposed = false,
  scrollTween: gsap.core.Tween | undefined,
  cleanupEffects = () => {};
const seg = segment;
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
function words(element: HTMLElement, text: string) {
  element.replaceChildren(
    ...text.split(" ").flatMap((word, i) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.className = "cinema-word";
      return i ? [document.createTextNode(" "), span] : [span];
    }),
  );
}
function locale() {
  const lang = (root.lang in copy ? root.lang : "ar") as keyof typeof copy;
  const c = copy[lang];
  document.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
    const value = c[el.dataset.copy as keyof typeof c];
    if (["line1", "line2", "first", "second"].includes(el.dataset.copy!))
      words(el, value);
    else el.textContent = value;
  });
  stage.querySelector<HTMLImageElement>(".ready-phone img")!.alt =
    lang === "ar"
      ? "واجهة تطبيق جسر"
      : lang === "fr"
        ? "Interface de l’application JISR"
        : "JISR application interface";
  pet.setAttribute("aria-label", c.pet);
  toggle.setAttribute("aria-label", c.toggle);
  stage.querySelector<HTMLImageElement>(".ready-phone img")!.src =
    `assets/screens/home-${lang}.png`;
}
function render(progress: number) {
  p = progress;
  const pin = stage.querySelector<HTMLElement>(".cinema-pin")!;
  const W = pin.clientWidth,
    H = pin.clientHeight;
  const bw = photo.offsetWidth,
    bh = photo.offsetHeight,
    bx = photo.offsetLeft,
    by = photo.offsetTop;
  const base: Quad = [
    { x: 662, y: 360 },
    { x: 901, y: 381 },
    { x: 901, y: 765 },
    { x: 663, y: 783 },
  ].map((q) => ({
    x: bx + (q.x / 1562) * bw,
    y: by + (q.y / 1007) * bh,
  })) as Quad;
  const center = {
    x: base.reduce((a, q) => a + q.x, 0) / 4,
    y: base.reduce((a, q) => a + q.y, 0) / 4,
  };
  const dolly = reduced() ? 1 : 1 + 0.18 * inOut(seg(p, 0, 0.7));
  photo.style.transformOrigin = `${center.x - bx}px ${center.y - by}px`;
  photo.style.transform = `scale(${dolly})`;
  const original = scaleQuad(base, center, dolly);
  const h =
    ((original[3].y - original[0].y + original[2].y - original[1].y) / 2) *
    1.06;
  const facing = lerpQuad(
    original,
    rectQuad(center.x, center.y, (h * CARD_WIDTH) / CARD_HEIGHT, h),
    inOut(seg(p, 0, 0.45)),
  );
  const coverH = Math.max(H, (W * CARD_HEIGHT) / CARD_WIDTH) * 1.2;
  const quad = lerpQuad(
    facing,
    rectQuad(W / 2, H / 2, (coverH * CARD_WIDTH) / CARD_HEIGHT, coverH),
    seg(p, 0.5, 0.82) ** 3,
  );
  const matrix = quadToMatrix3d(
    CARD_WIDTH,
    CARD_HEIGHT,
    reduced() ? base : quad,
  );
  portal.style.transform = matrix;
  light.style.transform = quadToMatrix3d(CARD_WIDTH, CARD_HEIGHT, original);
  light.style.opacity = String(1 - seg(p, 0.15, 0.4));
  portal.style.opacity = reduced() ? "0" : "1";
  portal.querySelector<HTMLElement>(".portal-rim")!.style.opacity = String(
    seg(p, 0.1, 0.4),
  );
  portal.querySelector<HTMLElement>(".portal-fill")!.style.opacity = String(
    seg(p, 0.35, 0.62),
  );
  heroCopy.style.transform = reduced()
    ? "none"
    : `translateY(${-120 * seg(p, 0.2, 0.8)}px)`;
  const reveal = reduced() ? (p >= 0.45 ? 1 : 0) : seg(p, 0.79, 0.81);
  heroCopy.style.opacity = reduced() && reveal === 1 ? "0" : "1";
  ready.style.opacity = String(reveal);
  ready.style.visibility = reveal ? "visible" : "hidden";
  ready.inert = reveal < 0.99;
  ready.setAttribute("aria-hidden", String(reveal < 0.99));
  heroCopy.inert = reveal > 0.99;
  heroCopy.setAttribute("aria-hidden", String(reveal > 0.99));
  header.dataset.scene = (reduced() ? p >= 0.45 : p > 0.76) ? "light" : "photo";
  if (reveal > 0.99 !== lastReady) {
    lastReady = reveal > 0.99;
    if (lastReady && !reduced()) {
      gsap.fromTo(
        ready.querySelector(".ready-arrival"),
        {
          rotationY: -70,
          rotation: 18,
          scale: 0.75,
          filter: `blur(${blur.arrival}) brightness(1.6)`,
        },
        {
          rotationY: 0,
          rotation: 0,
          scale: 1,
          filter: "blur(0px) brightness(1)",
          duration: 1.4,
          ease: "power3.out",
          clearProps: "filter",
        },
      );
      gsap.fromTo(
        ready.querySelectorAll(".cinema-word,.ready-lead,.ready-more,.ink"),
        { autoAlpha: 0, filter: `blur(${blur.text})`, y: 16 },
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.7,
          stagger: 0.055,
          clearProps: "filter,transform",
        },
      );
    }
  }
  stage.dataset.progress = p.toFixed(3);
}
function motion() {
  if (reduced()) {
    if (intro && intro.progress() < 1) {
      intro.progress(1);
      return;
    }
    gsap.killTweensOf(
      ".ready-arrival,.ready-phone img,.cinema-ready .cinema-word,.cinema-button,.speak-button",
    );
    gsap.set(".ready-arrival", {
      rotationY: 0,
      rotation: 0,
      scale: 1,
      clearProps: "filter",
    });
    gsap.set(".ready-phone img", { rotationX: 0, rotationY: 0 });
    gsap.set(".cinema-button,.speak-button", { x: 0, y: 0 });
    gsap.set(".cinema-ready .cinema-word", {
      autoAlpha: 1,
      y: 0,
      clearProps: "filter,transform",
    });
  }
  scrollTween?.scrollTrigger?.kill();
  scrollTween?.kill();
  cleanupEffects();
  const state = { p: 0 };
  scrollTween = gsap.to(state, {
    p: 1,
    ease: "none",
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: () => `+=${innerHeight * 1.5}`,
      scrub: reduced() ? true : 0.6,
      onUpdate: (self) => render(self.progress),
      invalidateOnRefresh: true,
    },
  });
  render(scrollTween.scrollTrigger?.progress || 0);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    if (root.dataset.motion === "reduced") return;
    gsap.to(".ready-float", {
      yPercent: -1,
      rotation: 0.7,
      duration: 3.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    document
      .querySelectorAll<HTMLElement>(".section-intro h2,.inside-heading h2")
      .forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.35, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 92%",
              end: "top 58%",
              scrub: true,
            },
          },
        );
      });
    gsap.fromTo(
      ".showcase-phone",
      { rotation: -8, y: 35 },
      {
        rotation: 5,
        y: -15,
        ease: "none",
        scrollTrigger: {
          trigger: ".showcase",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      },
    );
  });
  cleanupEffects = () => media.revert();
}
locale();
root.classList.add("cinematic");
header.dataset.scene = "photo";
document.querySelector<HTMLMetaElement>("meta[name=theme-color]")!.content =
  getComputedStyle(root).getPropertyValue("--brand-ivory").trim();
const nav = header.querySelector<HTMLElement>(".main-nav")!,
  lens = nav.querySelector<HTMLElement>(".nav-lens")!;
const navLinks = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
let current = navLinks[0];
function moveLens(link: HTMLElement, instant = false) {
  const bounds = nav.getBoundingClientRect(),
    target = link.getBoundingClientRect();
  if (!bounds.width) return;
  nav.dataset.lens = "ready";
  gsap.to(lens, {
    x: target.left - bounds.left,
    width: target.width,
    duration: instant || reduced() ? 0 : 0.4,
    ease: "power3.out",
  });
}
navLinks.forEach((link) => {
  link.addEventListener("pointerenter", () => moveLens(link));
  link.addEventListener("focus", () => moveLens(link));
  link.addEventListener("click", () => {
    current = link;
    moveLens(link);
  });
});
nav.addEventListener("pointerleave", () => moveLens(current));
const navObserver = new ResizeObserver(() => moveLens(current, true));
navObserver.observe(nav);
document.fonts.ready.then(() => moveLens(current, true));
const observers = new MutationObserver((mutations) => {
  if (mutations.some((m) => m.attributeName === "lang")) locale();
  if (mutations.some((m) => m.attributeName === "data-motion")) motion();
});
observers.observe(root, {
  attributes: true,
  attributeFilter: ["lang", "data-motion"],
});
const media = matchMedia("(prefers-reduced-motion: reduce)");
media.addEventListener("change", motion);
const resize = () => render(p);
addEventListener("resize", resize);
let objectUrl: string | undefined;
async function loadScene() {
  const response = await fetch("assets/portal/jisr-dawn.png", {
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error("Scene unavailable");
  const total = Number(response.headers.get("Content-Length"));
  const reader = response.body?.getReader();
  if (!reader) throw Error("Stream unavailable");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let loaded = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    loaded += result.value.byteLength;
    chunks.push(new Uint8Array(result.value));
    if (total)
      loader.querySelector(".loader-count")!.textContent = `${Math.min(
        99,
        Math.floor((loaded / total) * 99),
      )
        .toString()
        .padStart(2, "0")}%`;
  }
  objectUrl = URL.createObjectURL(new Blob(chunks, { type: "image/png" }));
  const image = stage.querySelector<HTMLImageElement>(".cinema-photo img")!;
  image.src = objectUrl;
  await image.decode();
}
root.dataset.cinemaLoading = "true";
let started = false;
function reveal() {
  if (started || disposed) return;
  started = true;
  loader.querySelector(".loader-count")!.textContent = "100%";
  render(0);
  if (reduced()) {
    loader.remove();
    delete root.dataset.cinemaLoading;
    motion();
    return;
  }
  const tl = gsap.timeline({
    onComplete: () => {
      loader.remove();
      delete root.dataset.cinemaLoading;
      motion();
    },
  });
  intro = tl;
  tl;
  tl.to(
    loader.querySelector(".loader-count"),
    { opacity: 0, duration: 0.15 },
    0.25,
  )
    .to(loader, { opacity: 0, duration: 0.4, pointerEvents: "none" }, 0.4)
    .fromTo(
      ".cinema-media,.cinema-over",
      { scale: 0 },
      { scale: 1, duration: 0.85, ease: "power2.out" },
      0.4,
    )
    .fromTo(
      header,
      { opacity: 0, filter: `blur(${blur.nav})` },
      { opacity: 1, filter: "blur(0px)", duration: 0.6, clearProps: "filter" },
      0.95,
    )
    .fromTo(
      ".cinema-title .cinema-word",
      { opacity: 0, filter: `blur(${blur.word})`, yPercent: 25 },
      {
        opacity: 1,
        filter: "blur(0px)",
        yPercent: 0,
        stagger: 0.09,
        duration: 0.7,
        clearProps: "filter,transform",
      },
      1.05,
    )
    .fromTo(
      ".cinema-actions,.cinema-lead,.cinema-title>p",
      { opacity: 0, filter: `blur(${blur.text})` },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.15,
        clearProps: "filter",
      },
      1.1,
    );
}
loader.querySelector("button")!.addEventListener("click", () => {
  reveal();
  intro?.progress(1);
});
Promise.allSettled([
  loadScene(),
  stage.querySelector<HTMLImageElement>(".ready-phone img")!.decode(),
  document.fonts.load("600 1em Plex"),
  document.fonts.load("400 1em Manrope"),
]).then(reveal);
// Magnetic hover is bounded and never moves a control away from keyboard or touch users.
const magnetCleanups: (() => void)[] = [];
document
  .querySelectorAll<HTMLElement>(".cinema-button,.speak-button")
  .forEach((button) => {
    const move = (e: PointerEvent) => {
      if (reduced() || e.pointerType !== "mouse") return;
      const b = button.getBoundingClientRect();
      gsap.to(button, {
        x: (e.clientX - b.left - b.width / 2) * 0.1,
        y: (e.clientY - b.top - b.height / 2) * 0.15,
        duration: 0.25,
      });
    };
    const leave = () =>
      gsap.to(button, { x: 0, y: 0, duration: 0.4, ease: "elastic.out(1,.5)" });
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerleave", leave);
    magnetCleanups.push(() => {
      button.removeEventListener("pointermove", move);
      button.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(button);
    });
  });
const tilt = (e: PointerEvent) => {
  if (reduced() || e.pointerType !== "mouse") return;
  gsap.to(".ready-phone img", {
    rotationY: (e.clientX / innerWidth - 0.5) * 16,
    rotationX: -(e.clientY / innerHeight - 0.5) * 12,
    transformPerspective: 1200,
    duration: 0.8,
    ease: "power2.out",
  });
};
addEventListener("pointermove", tilt, { passive: true });
addEventListener(
  "pagehide",
  (event) => {
    if (event.persisted) return;
    disposed = true;
    stopGhost();
    observers.disconnect();
    navObserver.disconnect();
    media.removeEventListener("change", motion);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", tilt);
    scrollTween?.scrollTrigger?.kill();
    scrollTween?.kill();
    cleanupEffects();
    magnetCleanups.forEach((fn) => fn());
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  },
  { once: true },
);
