import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./smooth";
import { $, $$, reduced, splitLetters, splitWords } from "./util";

let ctx: gsap.Context | undefined;
let cleanups: (() => void)[] = [];
let pin: ScrollTrigger | undefined;
let programmatic = false;
const revealed = new WeakSet<Element>();

/* ---------- static work that is safe in every motion mode ---------- */

function splitAll() {
  $$("[data-split]").forEach((el) => splitWords(el, "sw"));
  $$("[data-fill]").forEach((el) => splitWords(el, "sf"));
}

function progressBar() {
  const bar = $(".scroll-progress span");
  if (!bar) return;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => (bar.style.transform = `scaleX(${self.progress.toFixed(4)})`),
  });
}

/* ---------- motion scenes (only built when motion is allowed) ---------- */

function headings() {
  $$("h2").forEach((h2) => {
    const words = $$(".sw-i", h2);
    if (!words.length) return;
    if (revealed.has(h2)) return;
    gsap.set(words, { yPercent: 115, rotate: 3, opacity: 0 });
    ScrollTrigger.create({
      trigger: h2,
      start: "top 86%",
      once: true,
      onEnter: () => {
        revealed.add(h2);
        gsap.to(words, {
          yPercent: 0,
          rotate: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.07,
          ease: "power4.out",
        });
      },
    });
  });
}

function manifestoFill() {
  const h2 = $("#manifesto-title");
  if (!h2) return;
  const words = $$(".sf-i", h2);
  gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.12,
      ease: "none",
      scrollTrigger: { trigger: h2, start: "top 82%", end: "bottom 42%", scrub: 0.4 },
    },
  );
  gsap.fromTo(
    ".language-signature span",
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.12,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: ".language-signature", start: "top 90%", once: true },
    },
  );
  gsap.to(".manifesto-arch", {
    yPercent: -18,
    rotate: 34,
    ease: "none",
    scrollTrigger: { trigger: ".manifesto", start: "top bottom", end: "bottom top", scrub: true },
  });
}

function marquee() {
  const rows = $$(".marquee-row");
  rows.forEach((row) => {
    const track = $(".marquee-track", row)!;
    if (!track.dataset.cloned) {
      const items = [...track.children];
      // two extra copies keep the loop seamless on very wide screens
      for (let i = 0; i < 2; i++) items.forEach((n) => track.append(n.cloneNode(true)));
      track.dataset.cloned = "true";
    }
  });
  const band = $(".marquee-band")!;
  let visible = false;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(band);
  const offsets = rows.map(() => 0);
  let lastY = scrollY;
  let skew = 0;
  const tick = () => {
    const y = scrollY;
    const delta = y - lastY;
    lastY = y;
    if (!visible) return;
    skew += (Math.max(-6, Math.min(6, delta * 0.12)) - skew) * 0.12;
    rows.forEach((row, i) => {
      const track = row.firstElementChild as HTMLElement;
      const third = track.scrollWidth / 3;
      const dir = Number(row.dataset.direction) || 1;
      offsets[i] = (offsets[i] + delta * 0.55 * dir) % third;
      if (offsets[i] > 0) offsets[i] -= third;
      track.style.transform = `translate3d(${offsets[i].toFixed(2)}px,0,0) skewX(${(-skew * dir).toFixed(2)}deg)`;
    });
  };
  gsap.ticker.add(tick);
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    io.disconnect();
    rows.forEach((row) => ((row.firstElementChild as HTMLElement).style.transform = ""));
  });
}

function stepStack() {
  const cards = $$(".step-card");
  cards.forEach((card, i) => {
    if (i === cards.length - 1) return;
    gsap.to(card, {
      scale: 1 - (cards.length - 1 - i) * 0.045,
      "--veil": 0.55,
      ease: "none",
      scrollTrigger: {
        trigger: cards[i + 1],
        start: "top bottom",
        end: () => `top ${parseFloat(getComputedStyle(cards[i + 1]).top) || 0}px`,
        scrub: true,
      },
    });
  });
  cards.forEach((card) =>
    ScrollTrigger.create({
      trigger: card,
      start: "top 75%",
      end: "bottom top",
      toggleClass: { targets: card, className: "in-view" },
    }),
  );
  gsap.from(".how-intro > *", {
    y: 24,
    opacity: 0,
    stagger: 0.1,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: { trigger: ".how-intro", start: "top 85%", once: true },
  });
}

function bento() {
  const tiles = $$(".tile");
  gsap.from(tiles, {
    y: 60,
    opacity: 0,
    duration: 1,
    stagger: 0.09,
    ease: "power3.out",
    scrollTrigger: { trigger: ".bento", start: "top 85%", once: true },
  });
  const lang = $(".tile-lang");
  if (lang) {
    const words = $$(".hello-stack span", lang);
    ScrollTrigger.create({
      trigger: lang,
      start: "top 85%",
      end: "bottom 15%",
      onUpdate: (self) => {
        const i = Math.min(words.length - 1, Math.floor(self.progress * words.length));
        words.forEach((w, n) => w.classList.toggle("is-active", n === i));
      },
    });
  }
  const picto = $(".size-picto");
  if (picto) {
    const bars = $$(".size-scale i");
    gsap.fromTo(
      picto,
      { scale: 0.62 },
      {
        scale: 1.18,
        ease: "none",
        scrollTrigger: {
          trigger: ".tile-size",
          start: "top 90%",
          end: "bottom 30%",
          scrub: 0.5,
          onUpdate: (self) => bars.forEach((b, n) => b.classList.toggle("on", self.progress >= n / bars.length)),
        },
      },
    );
  }
  gsap.fromTo(
    ".care-line i",
    { scaleX: 0 },
    { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".tile-care", start: "top 85%", end: "center 45%", scrub: 0.5 } },
  );
}

function showcase() {
  const wrap = $(".showcase");
  const scene = $(".screen-scene");
  if (!wrap || !scene || innerWidth < 960 || wrap.offsetHeight + 130 > innerHeight) return;
  const tabs = $$<HTMLButtonElement>(".showcase-tab");
  const rail = $(".showcase-rail span");
  let current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  pin = ScrollTrigger.create({
    trigger: wrap,
    start: () => `top ${Math.max(100, (innerHeight - wrap.offsetHeight) / 2 + 30)}px`,
    end: () => `+=${innerHeight * 1.6}`,
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (rail) rail.style.transform = `scaleY(${self.progress.toFixed(4)})`;
      const i = Math.min(tabs.length - 1, Math.floor(self.progress * tabs.length * 0.999));
      if (i !== current) {
        current = i;
        programmatic = true;
        tabs[i].click();
        programmatic = false;
        wipe();
      }
    },
  });
  wrap.classList.add("is-pinned");
  cleanups.push(() => {
    wrap.classList.remove("is-pinned");
    pin = undefined;
  });
}

function wipe() {
  if (reduced()) return;
  gsap.fromTo(
    "#showcase-screen",
    { clipPath: "inset(100% 0% 0% 0% round 1.25rem)", scale: 1.06 },
    { clipPath: "inset(0% 0% 0% 0% round 1.25rem)", scale: 1, duration: 0.8, ease: "power3.out" },
  );
  gsap.fromTo(".screen-halo", { rotate: -40 }, { rotate: -30, duration: 1.2, ease: "power3.out" });
}

function download() {
  $$<SVGPathElement>(".bridge-lines path").forEach((path, i) => {
    const len = path.getTotalLength();
    gsap.fromTo(
      path,
      { strokeDasharray: len, strokeDashoffset: len },
      {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".download-section",
          start: `top ${80 - i * 8}%`,
          end: "center 55%",
          scrub: 0.6,
        },
      },
    );
  });
  gsap.fromTo(
    ".download-art > img",
    { y: 50, rotate: -18, scale: 0.85 },
    {
      y: -10,
      rotate: -6,
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: ".download-section", start: "top bottom", end: "center center", scrub: 0.8 },
    },
  );
  gsap.fromTo(
    ".download-art > span",
    { yPercent: 40, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      ease: "none",
      scrollTrigger: { trigger: ".download-section", start: "top 75%", end: "center 60%", scrub: 0.6 },
    },
  );
}

function bigMark() {
  const word = $(".big-mark-word");
  if (!word) return;
  const letters = splitLetters(word, "bm");
  gsap.fromTo(
    letters,
    { yPercent: 105 },
    {
      yPercent: 0,
      stagger: 0.08,
      ease: "none",
      scrollTrigger: { trigger: ".big-mark", start: "top 95%", end: "bottom bottom", scrub: 0.6 },
    },
  );
  gsap.fromTo(
    ".big-mark-ar",
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: ".big-mark", start: "top 80%", end: "bottom bottom", scrub: 0.6 } },
  );
}

function demoIntro() {
  gsap.from(".demo-choice", {
    y: 26,
    opacity: 0,
    stagger: 0.08,
    duration: 0.8,
    ease: "back.out(1.6)",
    scrollTrigger: { trigger: ".demo-board", start: "top 80%", once: true },
  });
}

/* ---------- lifecycle ---------- */

export function build() {
  teardown();
  splitAll();
  ctx = gsap.context(() => {
    progressBar();
    if (reduced()) return;
    headings();
    manifestoFill();
    marquee();
    stepStack();
    bento();
    showcase();
    download();
    bigMark();
    demoIntro();
  });
  ScrollTrigger.refresh();
}

function teardown() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  ctx?.revert();
  ctx = undefined;
  const word = $(".big-mark-word");
  if (word) word.textContent = "JISR";
}

/** Tab clicks scroll to the matching part of the pinned showcase. */
export function mountShowcaseLink() {
  $$<HTMLButtonElement>(".showcase-tab").forEach((tab, i, tabs) =>
    tab.addEventListener("click", () => {
      if (programmatic || !pin) return;
      const y = pin.start + ((i + 0.5) / tabs.length) * (pin.end - pin.start);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 1.1 });
      else scrollTo(0, y);
    }),
  );
}

/** Animated phrase in the try-it demo. */
export function mountPhrase() {
  const phrase = $("#demo-phrase");
  if (!phrase) return;
  let last = phrase.textContent;
  new MutationObserver(() => {
    const text = phrase.textContent;
    if (text === last) return;
    last = text;
    if (reduced()) return;
    const words = splitWords(phrase, "pw");
    gsap.fromTo(
      words,
      { yPercent: 70, opacity: 0, filter: "blur(8px)" },
      { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "filter" },
    );
  }).observe(phrase, { childList: true, characterData: true, subtree: true });
}

/** Smooth open and close for the FAQ disclosures. */
export function mountAccordion() {
  $$<HTMLDetailsElement>(".faq-list details").forEach((details) => {
    const summary = details.querySelector("summary")!;
    let anim: Animation | undefined;
    summary.addEventListener("click", (e) => {
      if (reduced()) return;
      e.preventDefault();
      anim?.cancel();
      const start = details.offsetHeight;
      const opening = !details.open;
      if (opening) details.open = true;
      const end = opening ? details.scrollHeight : summary.offsetHeight;
      details.style.overflow = "hidden";
      anim = details.animate(
        { height: [`${start}px`, `${end}px`] },
        { duration: 420, easing: "cubic-bezier(0.2, 0.75, 0.2, 1)" },
      );
      anim.onfinish = () => {
        if (!opening) details.open = false;
        details.style.overflow = "";
        anim = undefined;
        ScrollTrigger.refresh();
      };
    });
  });
}
