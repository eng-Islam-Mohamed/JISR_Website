export const root = document.documentElement;
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
export const reduced = () =>
  motionQuery.matches || root.dataset.motion === "reduced";
export const finePointer = () =>
  matchMedia("(hover: hover) and (pointer: fine)").matches;
export const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) =>
  el.querySelector<T>(s);
export const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [
  ...el.querySelectorAll<T>(s),
];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Splits text into word spans. Words are never split into letters, so Arabic
 * letters keep their joined forms. A "\n" in the source becomes a line break.
 */
export function splitWords(el: HTMLElement, cls: string): HTMLElement[] {
  const text = el.textContent ?? "";
  const frag = document.createDocumentFragment();
  text.split("\n").forEach((line, li) => {
    if (li) frag.append(document.createElement("br"));
    line
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word, i) => {
        if (i) frag.append(" ");
        const outer = document.createElement("span");
        outer.className = cls;
        const inner = document.createElement("span");
        inner.className = `${cls}-i`;
        inner.textContent = word;
        outer.append(inner);
        frag.append(outer);
      });
  });
  el.replaceChildren(frag);
  return $$<HTMLElement>(`.${cls}-i`, el);
}

/** Splits a Latin-only word (never used for Arabic) into letter spans. */
export function splitLetters(el: HTMLElement, cls: string): HTMLElement[] {
  const text = el.textContent ?? "";
  el.replaceChildren(
    ...[...text].map((ch) => {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = ch;
      return s;
    }),
  );
  return $$<HTMLElement>(`.${cls}`, el);
}
