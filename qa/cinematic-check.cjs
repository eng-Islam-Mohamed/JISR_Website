const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const qa = process.env.QA_NODE_MODULES
  ? createRequire(path.join(process.env.QA_NODE_MODULES, "_qa.cjs"))
  : require;
const { chromium } = qa("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [],
    failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("http://127.0.0.1:4173");
  await page.waitForSelector(".cinema-loader", {
    state: "detached",
    timeout: 18000,
  });
  assert.equal(
    await page.locator("html").getAttribute("data-cinema-loading"),
    null,
  );
  assert(await page.locator(".cinema-title h1").isVisible());
  assert.equal(
    await page.locator(".cinema-ready").getAttribute("aria-hidden"),
    "true",
  );
  await page.mouse.move(15, 300);
  await page.screenshot({
    path: path.join(__dirname, "cinematic-desktop.png"),
  });
  const initial = await page.locator(".portal-plane").boundingBox();
  await page.evaluate(() =>
    scrollTo({ top: innerHeight * 0.9, behavior: "instant" }),
  );
  await page.waitForTimeout(900);
  const grown = await page.locator(".portal-plane").boundingBox();
  assert(grown.width > initial.width);
  await page.screenshot({
    path: path.join(__dirname, "cinematic-transition.png"),
  });
  await page.evaluate(() =>
    scrollTo({ top: innerHeight * 1.6, behavior: "instant" }),
  );
  await page.waitForTimeout(1600);
  assert.equal(
    await page.locator(".cinema-ready").getAttribute("aria-hidden"),
    "false",
  );
  assert.equal(
    await page.locator(".header").getAttribute("data-scene"),
    "light",
  );
  await page.screenshot({ path: path.join(__dirname, "cinematic-ready.png") });
  const checks = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const lang of ["ar", "fr", "en"]) {
    await page.locator(".language-toggle").click();
    await page.locator(`[data-lang=${lang}]`).click();
    assert(
      (await page.locator(".ready-phone img").getAttribute("src")).endsWith(
        `home-${lang}.png`,
      ),
    );
    for (const width of [280, 320, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(120);
      assert(
        (await page.evaluate(() => document.documentElement.scrollWidth)) <=
          width + 1,
        `${lang}/${width} overflow`,
      );
      const clipped = await page
        .locator(".cinema h1,.cinema h2,.cinema-lead,.cinema-button")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => n.offsetWidth && n.scrollWidth > n.clientWidth + 2)
            .map((n) => n.outerHTML.slice(0, 120)),
        );
      assert.deepEqual(clipped, [], `${lang}/${width} clipped`);
      checks.push(`${lang}/${width}`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".language-toggle").click();
  await page.locator("[data-lang=ar]").click();
  await page.screenshot({ path: path.join(__dirname, "cinematic-mobile.png") });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.mouse.move(390 - 110, 844 * 0.43);
  await page.waitForTimeout(600);
  await page.locator(".ghost-pet").focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  assert.equal(
    await page.locator(".ghost-canvas").getAttribute("data-expression"),
    "press",
  );
  await page.locator(".ghost-toggle").click();
  assert.equal(
    await page.locator(".ghost-toggle").getAttribute("aria-pressed"),
    "false",
  );
  assert(await page.locator(".ghost-canvas").isHidden());
  await page.locator(".ghost-toggle").click();
  assert(await page.locator(".ghost-canvas").isVisible());
  await page.locator("[data-phrase=happy]").click();
  assert.equal(await page.locator("#demo-phrase").textContent(), "أنا سعيد");
  for (const tab of ["gallery", "detail", "settings"]) {
    await page.locator(`[data-screen=${tab}]`).click();
    assert(
      (await page.locator("#showcase-screen").getAttribute("src")).endsWith(
        `${tab}-ar.png`,
      ),
    );
  }
  for (const details of await page.locator("details").all()) {
    await details.locator("summary").click();
    assert.notEqual(await details.getAttribute("open"), null);
  }
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#download-apk").click();
  const download = await downloadEvent;
  const data = fs.readFileSync(await download.path());
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../downloads/release.json"), "utf8"),
  );
  assert.equal(data.length, manifest.bytes);
  assert.equal(
    require("node:crypto").createHash("sha256").update(data).digest("hex"),
    manifest.sha256,
  );
  const axe = require.resolve("axe-core/axe.min.js");
  await page.addScriptTag({ path: axe });
  const audit = await page.evaluate(async () =>
    axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
    }),
  );
  fs.writeFileSync(
    path.join(__dirname, "cinematic-axe.json"),
    JSON.stringify(audit.violations, null, 2),
  );
  assert.deepEqual(
    audit.violations.map((v) => `${v.id}: ${v.nodes.length}`),
    [],
  );
  const noJS = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJS.goto("http://127.0.0.1:4173");
  assert(await noJS.locator(".hero").isVisible());
  assert(await noJS.locator("#download-apk").isVisible());
  const blocked = await browser.newPage({ reducedMotion: "reduce" });
  await blocked.route("**/assets/portal/desert.webp", (r) => r.abort());
  await blocked.goto("http://127.0.0.1:4173");
  await blocked.waitForSelector(".cinema-loader", {
    state: "detached",
    timeout: 18000,
  });
  assert(await blocked.locator(".cinema-title h1").isVisible());
  assert.equal(
    await blocked.locator("html").getAttribute("data-cinema-loading"),
    null,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  const result = {
    responsive: checks,
    portal: "Projection grows and reveals accessible second screen",
    ghost: "Keyboard press, expression, show/hide verified",
    download: "Real bytes and SHA-256 match",
    axe: "No violations in tested Arabic lower-page state",
    fallbacks: "No-JS content and failed-photo intro recovery work",
    errors,
  };
  fs.writeFileSync(
    path.join(__dirname, "cinematic-results.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
