import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountCursor } from "./fluid";
import { glassLight, liquidGlass } from "./glass";
import {
  mountJelly,
  mountMagnets,
  mountManifestoGlow,
  mountMarkLight,
  mountSpotlights,
  mountTilt,
} from "./pointer";
import { build, mountAccordion, mountPhrase, mountShowcaseLink } from "./scenes";
import { mountAnchors, startSmooth, stopSmooth } from "./smooth";
import { $, $$, reduced, root } from "./util";

function motionMode() {
  if (reduced()) stopSmooth();
  else startSmooth();
}

/** Premium layer: smooth scrolling, scroll scenes, pointer effects and liquid glass. */
export function mountPremium() {
  mountAnchors();
  motionMode();
  build();
  mountCursor();
  mountSpotlights();
  mountTilt();
  mountJelly();
  mountMagnets();
  mountManifestoGlow();
  mountMarkLight();
  mountPhrase();
  const speak = $("#speak");
  if (speak && !$(".speak-wave", speak)) {
    const wave = document.createElement("span");
    wave.className = "speak-wave";
    wave.setAttribute("aria-hidden", "true");
    wave.innerHTML = "<i></i><i></i><i></i><i></i>";
    speak.append(wave);
  }
  mountAccordion();
  mountShowcaseLink();

  const header = $(".header");
  const nav = $(".main-nav");
  const toggle = $(".ghost-toggle");
  if (header) liquidGlass(header, "lg-header", { bezel: 18, strength: 0.9, blur: "3px" });
  if (nav) liquidGlass(nav, "lg-nav", { bezel: 16, strength: 1, blur: "1.5px" });
  if (toggle) liquidGlass(toggle, "lg-toggle", { bezel: 12, strength: 1.1 });
  $$(".main-nav, .header, .ghost-toggle").forEach(glassLight);

  let timer = 0;
  const rebuild = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      motionMode();
      build();
    }, 60);
  };
  new MutationObserver(rebuild).observe(root, {
    attributes: true,
    attributeFilter: ["lang", "data-motion"],
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", rebuild);
  let width = innerWidth;
  addEventListener("resize", () => {
    if (Math.abs(innerWidth - width) < 40) return;
    width = innerWidth;
    rebuild();
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener("load", () => ScrollTrigger.refresh());
}
