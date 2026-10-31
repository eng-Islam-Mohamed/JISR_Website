import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "./tokens.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(path.join(root, "index.html"), "utf8");
let count = 0;
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const ref = match[1];
  if (/^(?:https?:|mailto:|data:)/.test(ref)) continue;
  if (!existsSync(path.join(root, ref)))
    throw Error(`Missing local resource: ${ref}`);
  count++;
}
for (const file of [
  "app.js",
  "cinematic.js",
  "cinematic.css",
  "assets/portal/jisr-dawn.png",
  "styles.css",
  "glass.css",
  "tokens.css",
  "assets/shaders/bridge.vert",
  "assets/shaders/bridge.frag",
  "assets/glass-displacement.png",
])
  if (!statSync(path.join(root, file)).size) throw Error(`Empty file: ${file}`);
for (const language of ["ar", "fr", "en"]) {
  for (const screen of ["home", "gallery", "detail", "settings"]) {
    if (
      !existsSync(path.join(root, `assets/screens/${screen}-${language}.png`))
    )
      throw Error(`Missing ${language} ${screen} capture`);
  }
}
if (/href\s*=\s*["'][^"']*\.apk|\sdownload\s*=/i.test(html))
  throw Error("Preview must not expose an application download link");
if (!/<button[^>]*disabled[^>]*class="button primary download-button"/s.test(html))
  throw Error("Preview app download button must be disabled");
console.log(
  `PASS: ${count} local resources and localized captures exist; app download is disabled.`,
);
