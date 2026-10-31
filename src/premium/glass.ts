/*
 * Liquid glass for the web.
 *
 * The optics follow the approach of liquid_glass_widgets (MIT, Sebastian Degenaar /
 * whynotmake.it): a rounded-rect signed distance field gives a convex bezel height,
 * the surface normal is refracted with Snell's law (n = 1.5), and the refracted ray
 * becomes a per-pixel sampling offset. Here that offset is baked into an SVG
 * displacement map and applied through `backdrop-filter: url(#…)` (Chromium only).
 * A light RGB split mimics the package's chromatic dispersion. Other browsers keep
 * the CSS frosted-glass fallback, and nothing depends on the effect.
 *
 * The nav indicator uses the package's underdamped spring (damping ratio 0.73) with
 * velocity-based squash and stretch, its "jelly" behaviour.
 */
import { reduced } from "./util";

const SVG_NS = "http://www.w3.org/2000/svg";
const supported =
  "userAgentData" in navigator && CSS.supports("backdrop-filter", "url(#x)");

function sdRoundRect(px: number, py: number, hx: number, hy: number, r: number) {
  const qx = Math.abs(px) - hx + r;
  const qy = Math.abs(py) - hy + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
// Convex squircle bezel profile, 0 at the rim and 1 on the flat face.
const profile = (t: number) => Math.pow(1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4), 0.25);

function buildMap(w: number, h: number, radius: number, bezel: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const hx = w / 2,
    hy = h / 2,
    r = Math.min(radius, hx, hy);
  const thickness = bezel * 0.9,
    eta = 1 / 1.5,
    e = 0.5,
    d = 0.01;
  const dx = new Float32Array(w * h),
    dy = new Float32Array(w * h);
  let max = 0.0001;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hx,
        py = y + 0.5 - hy;
      const inside = -sdRoundRect(px, py, hx, hy, r);
      if (inside <= 0 || inside >= bezel) continue;
      const gx = sdRoundRect(px + e, py, hx, hy, r) - sdRoundRect(px - e, py, hx, hy, r);
      const gy = sdRoundRect(px, py + e, hx, hy, r) - sdRoundRect(px, py - e, hx, hy, r);
      const gl = Math.hypot(gx, gy) || 1;
      const t = inside / bezel;
      const slope = ((profile(t + d) - profile(t - d)) / (2 * d)) * (thickness / bezel);
      let nx = (slope * gx) / gl,
        ny = (slope * gy) / gl,
        nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;
      // refract(I = (0,0,-1), N, eta)
      const cosi = nz;
      const k = 1 - eta * eta * (1 - cosi * cosi);
      if (k < 0) continue;
      const f = eta * cosi - Math.sqrt(k);
      const tx = f * nx,
        ty = f * ny,
        tz = -eta + f * nz;
      const len = (thickness * profile(t)) / Math.max(0.2, -tz);
      const i = y * w + x;
      dx[i] = tx * len;
      dy[i] = ty * len;
      max = Math.max(max, Math.abs(dx[i]), Math.abs(dy[i]));
    }
  }
  for (let i = 0; i < w * h; i++) {
    img.data[i * 4] = 128 + Math.round((dx[i] / max) * 127);
    img.data[i * 4 + 1] = 128 + Math.round((dy[i] / max) * 127);
    img.data[i * 4 + 2] = 128;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL(), scale: max * 2 };
}

let defs: SVGDefsElement | undefined;
function ensureDefs() {
  if (defs) return defs;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "icon-definitions");
  defs = document.createElementNS(SVG_NS, "defs");
  svg.append(defs);
  document.body.append(svg);
  return defs;
}

const channel = (r: number, g: number, b: number) =>
  `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;

function writeFilter(id: string, w: number, h: number, map: { url: string; scale: number }, strength: number) {
  const s = map.scale * strength;
  const disp = (scale: number, result: string) =>
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale.toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="${result}"/>`;
  const filter = document.getElementById(id) ?? document.createElementNS(SVG_NS, "filter");
  filter.id = id;
  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", String(w));
  filter.setAttribute("height", String(h));
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("color-interpolation-filters", "sRGB");
  filter.innerHTML =
    `<feImage href="${map.url}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
    disp(s * 1.08, "dr") +
    disp(s, "dg") +
    disp(s * 0.92, "db") +
    `<feColorMatrix in="dr" type="matrix" values="${channel(1, 0, 0)}" result="r"/>` +
    `<feColorMatrix in="dg" type="matrix" values="${channel(0, 1, 0)}" result="g"/>` +
    `<feColorMatrix in="db" type="matrix" values="${channel(0, 0, 1)}" result="b"/>` +
    `<feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/>`;
  if (!filter.isConnected) ensureDefs().append(filter);
}

interface GlassOptions {
  bezel?: number;
  strength?: number;
  blur?: string;
}

/** Applies real refraction to `el`, rebuilding its map whenever it resizes. */
export function liquidGlass(el: HTMLElement, id: string, options: GlassOptions = {}) {
  if (!supported) return;
  const { bezel = 14, strength = 1, blur = "0.5px" } = options;
  let key = "";
  const update = () => {
    const w = Math.round(el.offsetWidth),
      h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2);
    const next = `${w}x${h}x${radius}`;
    if (next === key) return;
    key = next;
    writeFilter(id, w, h, buildMap(w, h, radius, Math.min(bezel, h / 2)), strength);
    el.style.setProperty("--lg-filter", `url(#${id}) blur(${blur}) saturate(1.5) brightness(1.04)`);
    el.dataset.liquid = "on";
  };
  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }).observe(el);
  update();
}

/** Specular highlight that follows the pointer across glass surfaces. */
export function glassLight(el: HTMLElement) {
  el.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const b = el.getBoundingClientRect();
    el.style.setProperty("--light-x", `${((e.clientX - b.left) / b.width) * 100}%`);
    el.style.setProperty("--light-y", `${((e.clientY - b.top) / b.height) * 100}%`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.removeProperty("--light-x");
    el.style.removeProperty("--light-y");
  });
}

/** Underdamped spring with squash and stretch for a sliding glass lens. */
export function jellyLens(lens: HTMLElement) {
  const stiffness = 340,
    damping = 2 * 0.73 * Math.sqrt(stiffness);
  let x = 0,
    w = 0,
    vx = 0,
    vw = 0,
    tx = 0,
    tw = 0,
    running = false,
    last = 0;
  const paint = () => {
    const stretch = Math.min(Math.abs(vx) / 2200, 0.2);
    lens.style.width = `${w}px`;
    lens.style.transform = `translateX(${x}px) scale(${1 + stretch}, ${1 - stretch * 0.5})`;
  };
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    vx += (stiffness * (tx - x) - damping * vx) * dt;
    vw += (stiffness * (tw - w) - damping * vw) * dt;
    x += vx * dt;
    w += vw * dt;
    if (Math.abs(tx - x) < 0.25 && Math.abs(vx) < 3 && Math.abs(tw - w) < 0.25 && Math.abs(vw) < 3) {
      x = tx;
      w = tw;
      vx = vw = 0;
      paint();
      running = false;
      return;
    }
    paint();
    requestAnimationFrame(step);
  };
  return (nextX: number, nextW: number, instant = false) => {
    tx = nextX;
    tw = nextW;
    if (instant || reduced() || !w) {
      x = tx;
      w = tw;
      vx = vw = 0;
      paint();
      return;
    }
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    }
  };
}
