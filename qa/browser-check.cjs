const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const requireQA = process.env.QA_NODE_MODULES
  ? createRequire(path.join(process.env.QA_NODE_MODULES, "_qa.cjs"))
  : require;
const { chromium } = requireQA("playwright");
const out = __dirname;
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("http://127.0.0.1:4173");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(out, "desktop-ar.png"),
    fullPage: true,
  });
  const checks = [];
  for (const lang of ["ar", "fr", "en"]) {
    await page.locator(".language-toggle").click();
    await page.locator(`[data-lang=${lang}]`).click();
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      lang === "ar" ? "rtl" : "ltr",
    );
    for (const width of [280, 320, 390, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert(
        overflow.scroll <= width + 1,
        `Overflow ${lang} at ${width}: ${JSON.stringify(overflow)}`,
      );
      const clipped = await page
        .locator("h1,h2,p,summary,button")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) => n.offsetWidth && n.scrollWidth > n.clientWidth + 2)
            .map((n) => n.outerHTML.slice(0, 100)),
        );
      assert.deepEqual(clipped, [], `Clipped text at ${lang}/${width}`);
      checks.push(`${lang}/${width}: no horizontal overflow or clipped text`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(out, "mobile-en.png"),
    fullPage: true,
  });
  await page.locator(".language-toggle").click();
  await page.locator("[data-lang=ar]").click();
  await page.screenshot({
    path: path.join(out, "mobile-ar.png"),
    fullPage: true,
  });
  await page.locator("[data-phrase=happy]").click();
  assert.equal(await page.locator("#demo-phrase").textContent(), "أنا سعيد");
  assert.equal(
    await page.locator("[data-phrase=happy]").getAttribute("aria-pressed"),
    "true",
  );
  // Browser speech varies by host. Verify real failure handling without pretending audio played.
  await page.evaluate(() =>
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        cancel() {},
        speak(utterance) {
          utterance.onerror();
        },
      },
      configurable: true,
    }),
  );
  await page.locator("#speak").click();
  assert.equal(
    await page.locator("#speech-status").getAttribute("data-error"),
    "true",
  );
  await page.locator("[data-screen=detail]").click();
  assert(
    (await page.locator("#showcase-screen").getAttribute("src")).endsWith(
      "detail-ar.png",
    ),
  );
  await page.locator("[data-screen=detail]").press("ArrowDown");
  assert.equal(
    await page.locator("[data-screen=settings]").getAttribute("aria-selected"),
    "true",
  );
  await page.locator("[data-screen=settings]").press("Home");
  assert.equal(
    await page.locator("[data-screen=gallery]").getAttribute("aria-selected"),
    "true",
  );
  for (const details of await page.locator("details").all()) {
    await details.locator("summary").click();
    assert((await details.getAttribute("open")) !== null);
    await details.locator("summary").click();
  }
  await page.locator(".language-toggle").click();
  await page.keyboard.press("Escape");
  assert.equal(
    await page.locator(".language-toggle").getAttribute("aria-expanded"),
    "false",
  );
  const downloadWait = page.waitForEvent("download");
  await page.locator("#download-apk").click();
  const download = await downloadWait;
  const downloaded = await download.path();
  const release = JSON.parse(
    fs.readFileSync(path.join(out, "../downloads/release.json"), "utf8"),
  );
  const downloadedBytes = fs.readFileSync(downloaded);
  assert.equal(downloadedBytes.length, release.bytes);
  assert.equal(
    require("node:crypto")
      .createHash("sha256")
      .update(downloadedBytes)
      .digest("hex"),
    release.sha256,
  );
  checks.push(
    "Real browser APK download: bytes and SHA-256 match release manifest",
  );
  await page.locator("#motion-toggle").click();
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "reduced",
  );
  await page.reload();
  assert.equal(
    await page.locator("html").getAttribute("data-motion"),
    "reduced",
  );
  await page.context().clearCookies();
  const noJS = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noJS.goto("http://127.0.0.1:4173");
  assert(await noJS.locator("h1").isVisible());
  assert(await noJS.locator("#download-apk").isVisible());
  const response = await noJS.request.head(
    "http://127.0.0.1:4173/downloads/jisr-android.apk",
  );
  assert.equal(response.status(), 200);
  const axePath = (() => {
    try {
      return require.resolve("axe-core/axe.min.js");
    } catch {
      try {
        return requireQA.resolve("axe-core/axe.min.js");
      } catch {
        return null;
      }
    }
  })();
  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const axe = await page.evaluate(
      async () =>
        await axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        }),
    );
    fs.writeFileSync(
      path.join(out, "axe.json"),
      JSON.stringify(axe.violations, null, 2),
    );
    assert.deepEqual(
      axe.violations.map((v) => `${v.id}: ${v.nodes.length}`),
      [],
    );
    checks.push(
      "axe: zero WCAG A/AA violations in rendered Arabic mobile page",
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  checks.push(
    "Pictogram selection, speech error state, tab click/keyboard, FAQ, language, motion persistence, no-JS content: passed",
  );
  fs.writeFileSync(
    path.join(out, "browser-results.json"),
    JSON.stringify({ checks, errors, failed, axe: !!axePath }, null, 2),
  );
  console.log(checks.join("\n"));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
