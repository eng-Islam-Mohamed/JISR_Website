// Every colour and behaviour number of the ghost. Sizes scale with U, 40% of the window's shorter side; numbers
// marked "at U 340" are multiplied by U / 340. Shape geometry lives in outline.ts (body) and eyes.ts (eyes).

/** Colours as "r,g,b" (alpha is added where they're drawn) or hex. */
const styles = getComputedStyle(document.documentElement);
const hex = (name: string) => styles.getPropertyValue(`--${name}`).trim();
const rgb = (name: string) => {
  const value = hex(name).replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)).join(",");
};
const sky = rgb("brand-sky"),
  lilac = rgb("brand-lilac"),
  sage = rgb("brand-sage"),
  mist = rgb("brand-mist"),
  ivory = rgb("brand-ivory");
export const COLORS = {
  page: hex("brand-ivory"),
  backGlow: sky,
  backGlowMid: lilac,
  backGlowEdge: ivory,
  pattern: mist,
  dust: ivory,
  shadow: mist,
  ripple: mist,
  auraCyan: sky,
  auraMagenta: lilac,
  auraViolet: mist,
  edgeCyan: sky,
  edgeMagenta: lilac,
  bodyTop: `rgba(${sky},0.62)`,
  bodyMid: `rgba(${mist},0.50)`,
  bodyBottom: `rgba(${lilac},0.60)`,
  innerMagenta: lilac,
  innerBlue: sky,
  innerTeal: sage,
  core: ivory,
  scanline: hex("brand-ivory"),
  rimTop: ivory,
  rimMid: sky,
  rimBottom: lilac,
  ringTop: ivory,
  ringMid: sky,
  ringBottom: lilac,
  ringShadow: mist,
  hairline: ivory,
  specular: ivory,
  eye: hex("color-ink"),
  eyeGlow: sky,
  sparks: [sky, lilac, sage, ivory],
  z: rgb("color-ink"),
} as const;

/** Behaviour. Times in seconds. */
export const BEHAVIOUR = {
  sleepAfter: 5, // still cursor → asleep
  startleSpeed: 1700, // cursor speed that startles it, px/s at U 340
  wakeHop: 240, // upward kick when it wakes, px/s
  clickHop: 150, // … when it's clicked
  startleHop: 200, // … when it's startled
  gravity: 1300, // px/s² at U 340
  firstBlink: 2,
  blinkGap: [2.2, 2.6], // next blink after 2.2 + random × 2.6 s
  blinkLength: 0.16,
  clickSparks: 26,
  startleSparks: 6,
  rippleLife: 1.1,
  zLife: 2.4,
  zRate: 0.7, // "z"s per second while asleep
  dustCount: 26,
} as const;
