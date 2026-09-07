// Run with NODE_PATH pointing to an installed Playwright package.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "mediapipe-phase1a-"));
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400) errors.push(response.status() + " " + response.url());
  });
  page.on("requestfailed", request => errors.push(request.url() + " " + request.failure().errorText));
  const http = "http://127.0.0.1:8000/mediapipe/";
  const file = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
  const expectedSections = ["mission", "demo", "how", "learn", "setup", "step1", "opencv", "step2", "landmarks", "step3", "tournament", "extend"];
  async function avatar() {
    const photo = page.locator(".avatar img").first();
    await photo.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const image = document.querySelector(".avatar img");
      return image && image.complete && image.naturalWidth > 0 && image.classList.contains("is-loaded");
    });
    assert.match(await photo.getAttribute("src"), /assets\/img\/instructor\.webp$/);
  }
  async function modal() {
    const opener = page.getByRole("button", { name: "강사 소개 보기", exact: true }).first();
    await opener.click();
    assert.equal(await page.locator("dialog").evaluate(el => el.open), true);
    assert.equal(await page.locator("dialog .credentials li").count(), 10);
    await page.waitForFunction(() => document.querySelector("dialog img")?.naturalWidth > 0);
    assert.ok(await page.locator("dialog").evaluate(el => el.scrollWidth <= el.clientWidth));
    assert.ok(await page.locator("dialog").evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
    }));
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("dialog").evaluate(el => el.open), false);
    assert.equal(await opener.evaluate(el => el === document.activeElement), true);
  }
  for (const url of [http, file]) {
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.equal(await page.locator(".level-card").count(), 2);
    const coming = page.locator('.level-card[data-status="coming"]');
    assert.equal(await coming.getAttribute("aria-disabled"), "true");
    assert.equal(await coming.getAttribute("href"), null);
    assert.equal(await coming.locator("a, button, [tabindex]").count(), 0);
    assert.equal(await coming.locator("img").count(), 0);
    assert.match(await coming.innerText(), /준비 중/);
    assert.ok(Number(await coming.evaluate(el => getComputedStyle(el).opacity)) < 1);
    await coming.click();
    assert.equal(page.url(), url);
    await page.keyboard.press("p");
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("is-presenting")), false);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("lecture-progress:")).length), 0);
    await avatar();
    await modal();
    if (url === http) {
      await page.locator('.level-card[data-status="ready"]').click();
      assert.equal(page.url(), http + "level1/");
    } else {
      // Directory links are inspected; file schemes do not resolve directory index documents.
      assert.equal(await page.locator('.level-card[data-status="ready"]').getAttribute("href"), "./level1/");
      await page.goto(pathToFileURL(path.resolve(__dirname, "../level1/index.html")).href);
    }
    assert.equal(await page.title(), "AI 스쿼트 왕");
    assert.deepEqual(await page.locator(".lecture-section").evaluateAll(nodes => nodes.map(el => el.id)), expectedSections);
    assert.equal(await page.locator("[data-section-nav] a").count(), 12);
    assert.equal(await page.locator("pre").count(), 0);
    await page.keyboard.press("p");
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("is-presenting")), true);
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator(".presentation-counter").innerText(), "2 / 12");
    await page.keyboard.press("b");
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("is-blackout")), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("is-presenting")), false);
    assert.ok(JSON.parse(await page.evaluate(() => localStorage.getItem("lecture-progress:level1"))).includes("mission"));
    await page.reload();
    assert.ok(await page.locator(".section-check").count() > 0);
    await avatar();
    await modal();
    if (url === http) {
      await page.getByRole("link", { name: "← 강의 목록" }).click();
      assert.equal(page.url(), http);
    }
    console.log("PASS protocol", url.startsWith("http") ? "HTTP subpath + round trip" : "file hub + level + modal");
  }
  for (const width of [375, 1920]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1080 });
    for (const route of ["", "level1/"]) {
      await page.goto(http + route);
      for (const section of await page.locator("[data-reveal]").all()) {
        await section.scrollIntoViewIfNeeded();
        await page.waitForFunction(id => {
          const el = document.getElementById(id);
          return getComputedStyle(el).opacity === "1";
        }, await section.getAttribute("id"));
      }
      for (const theme of ["light", "dark"]) {
        if (await page.locator("html").getAttribute("data-theme") !== theme) {
          await page.locator("[data-theme-toggle]").click();
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: path.join(output, (route ? "level1" : "hub") + "-" + width + "-" + theme + ".png"), fullPage: true });
        await modal();
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "auto");
      assert.equal(await page.locator(".is-reveal-pending").count(), 0);
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
  }
  assert.deepEqual(errors, []);
  console.log("PASS 375/1920, light/dark, reduced motion, images, no browser/resource errors");
  console.log("Screenshots:", output);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
