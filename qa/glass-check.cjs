const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const requireQA = process.env.QA_NODE_MODULES
  ? createRequire(path.join(process.env.QA_NODE_MODULES, "_qa.cjs"))
  : require;
const { chromium } = requireQA("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "no-preference",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173");
  await page.waitForFunction(
    () => document.querySelector(".hero-stage").dataset.renderer === "webgl",
  );
  await page.evaluate(() => document.fonts.ready);
  const uniform = () =>
    page.locator("canvas").evaluate((canvas) => {
      const gl = canvas.getContext("webgl");
      const program = gl.getParameter(gl.CURRENT_PROGRAM);
      return [
        ...gl.getUniform(program, gl.getUniformLocation(program, "pointer")),
      ];
    });
  await page.mouse.move(200, 250);
  await page.waitForTimeout(250);
  const before = await uniform();
  await page.mouse.move(550, 500);
  await page.waitForTimeout(250);
  const after = await uniform();
  assert.notDeepEqual(
    before,
    after,
    "Pointer must actually change the shader uniform",
  );
  const lens = page.locator(".nav-lens");
  const lensBefore = await lens.boundingBox();
  await page.locator(".main-nav a").last().hover();
  await page.waitForTimeout(550);
  const lensAfter = await lens.boundingBox();
  assert(
    Math.abs(lensAfter.x - lensBefore.x) > 50,
    "Navigation lens must move to the hovered link",
  );
  await page.mouse.move(1430, 5);
  await page.waitForTimeout(550);
  await page.screenshot({ path: path.join(__dirname, "glass-desktop.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  const staticBefore = await uniform();
  await page.mouse.move(300, 300);
  await page.waitForTimeout(150);
  assert.deepEqual(
    await uniform(),
    staticBefore,
    "Reduce motion must suppress shader travel",
  );
  assert.equal(
    await page
      .locator("canvas")
      .evaluate((canvas) => canvas.getContext("webgl").getError()),
    0,
  );
  await page.evaluate(() => {
    const gl = document.querySelector("canvas").getContext("webgl");
    window.__testLoss = gl.getExtension("WEBGL_lose_context");
    window.__testLoss.loseContext();
  });
  await page.waitForFunction(
    () => document.querySelector(".hero-stage").dataset.renderer === "fallback",
  );
  assert(await page.locator(".bridge-back").isVisible());
  await page.evaluate(() => window.__testLoss.restoreContext());
  await page.waitForFunction(
    () => document.querySelector(".hero-stage").dataset.renderer === "webgl",
  );
  assert.equal(
    await page
      .locator("canvas")
      .evaluate((canvas) => canvas.getContext("webgl").getError()),
    0,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const resolution = await page
    .locator("canvas")
    .evaluate((canvas) => ({
      width: canvas.width,
      display: canvas.getBoundingClientRect().width,
    }));
  assert(
    Math.abs(resolution.width - resolution.display) <= 1,
    "Phone back buffer is capped to CSS pixel resolution",
  );
  await page.screenshot({
    path: path.join(__dirname, "glass-mobile.png"),
    fullPage: true,
  });
  const fallback = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === "webgl" ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto("http://127.0.0.1:4173");
  await fallback.waitForFunction(
    () => document.querySelector(".hero-stage").dataset.renderer === "fallback",
  );
  assert(await fallback.locator("#hero-screen").isVisible());
  assert(await fallback.locator(".bridge-back").isVisible());
  assert.equal(
    (
      await fallback.request.head(
        "http://127.0.0.1:4173/downloads/jisr-android.apk",
      )
    ).status(),
    200,
  );
  await fallback.screenshot({
    path: path.join(__dirname, "glass-fallback.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  const result = {
    renderer: "WebGL compiled and rendered",
    pointer: "Actual shader uniforms respond",
    lens: "Moves between navigation links",
    reducedMotion: "Shader motion stops",
    contextLoss: "Fallback appears, restored context renders again",
    phoneResolution: "Back buffer capped",
    withoutWebGL: "App image, CSS glass, download remain available",
    errors,
  };
  fs.writeFileSync(
    path.join(__dirname, "glass-results.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
