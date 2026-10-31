/* Minimal typings for the vendored Lenis build (only the API this site uses). */
export interface LenisOptions {
  lerp?: number;
  duration?: number;
  smoothWheel?: boolean;
  syncTouch?: boolean;
  wheelMultiplier?: number;
  touchMultiplier?: number;
  autoRaf?: boolean;
  anchors?: boolean | { offset?: number; duration?: number };
  prevent?: (node: HTMLElement) => boolean;
}
export interface ScrollToOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
  lock?: boolean;
  force?: boolean;
  onComplete?: () => void;
}
export default class Lenis {
  constructor(options?: LenisOptions);
  readonly scroll: number;
  readonly velocity: number;
  readonly progress: number;
  readonly isStopped: boolean;
  raf(time: number): void;
  on(event: "scroll", callback: (lenis: Lenis) => void): () => void;
  scrollTo(target: number | string | HTMLElement, options?: ScrollToOptions): void;
  start(): void;
  stop(): void;
  resize(): void;
  destroy(): void;
}
