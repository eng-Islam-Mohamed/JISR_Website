export type Pt = [number, number];

export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep from a to b. */
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** "r,g,b" + alpha → a canvas colour string. */
export const rgba = (rgb: string, a: number) => `rgba(${rgb},${a})`;
