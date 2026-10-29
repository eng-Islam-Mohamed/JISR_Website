import { readFileSync, writeFileSync } from "node:fs";
const source = JSON.parse(
  readFileSync(new URL("../design-tokens.json", import.meta.url), "utf8"),
);
const vars = [];
function visit(value, path = []) {
  if ("$value" in value) {
    const v =
      value.$type === "cubicBezier"
        ? `cubic-bezier(${value.$value.join(",")})`
        : value.$value;
    vars.push(`  --${path.join("-")}: ${v};`);
    return;
  }
  Object.entries(value).forEach(([key, item]) => visit(item, [...path, key]));
}
visit(source);
writeFileSync(
  new URL("../tokens.css", import.meta.url),
  `/* Generated from design-tokens.json by scripts/tokens.mjs. */\n:root {\n${vars.join("\n")}\n}\n`,
);
console.log(`Generated ${vars.length} CSS design tokens.`);
