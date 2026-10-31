import "./check.mjs";
import { cpSync, mkdirSync, existsSync, lstatSync, realpathSync, rmSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const projectRoot = realpathSync(new URL("../", import.meta.url));
const output = new URL("../dist/", import.meta.url);
const outputPath = path.resolve(fileURLToPath(output));
if (path.dirname(outputPath) !== projectRoot || path.basename(outputPath) !== "dist")
  throw Error("Build output escaped the project");
if (existsSync(outputPath)) {
  if (lstatSync(outputPath).isSymbolicLink() || path.dirname(realpathSync(outputPath)) !== projectRoot)
    throw Error("Refusing to clean an unexpected output directory");
  rmSync(outputPath, { recursive:true, force:true });
}
mkdirSync(output, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "glass.css",
  "tokens.css",
  "app.js",
  "cinematic.js",
  "cinematic.css",
  "SOURCES.md",
  "assets",
  "_headers",
  ".htaccess",
]) {
  cpSync(new URL(`../${file}`, import.meta.url), new URL(file, output), {
    recursive: true,
  });
}
function verifyNoInstallers(directory) {
  for (const entry of readdirSync(directory, {withFileTypes:true})) {
    const target = path.join(directory,entry.name);
    if (entry.isDirectory()) verifyNoInstallers(target);
    else if (/\.(apk|aab|ipa)$/i.test(entry.name)) throw Error("Preview contains an installer");
  }
}
verifyNoInstallers(outputPath);
console.log(
  "Static deployment ready in website/dist. No server or npm packages are needed in production.",
);
