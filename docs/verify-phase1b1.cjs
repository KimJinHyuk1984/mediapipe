const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

(async () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../level1/index.html"), "utf8");
  const todo = [...html.matchAll(/<!-- TODO:/g)];
  assert.equal(todo.length, 7);
  for (const id of ["step1", "opencv", "step2", "landmarks", "step3", "tournament", "extend"]) {
    const section = html.match(new RegExp('<section class="lecture-section" id="' + id + '"[\\s\\S]*?</section>'))[0];
    assert.ok(section.includes("<!-- TODO:"));
    assert.equal((section.match(/<p/g) || []).length, 1);
  }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "mediapipe-phase1b1-"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"], reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) errors.push(r.url()); });
  await page.goto("http://127.0.0.1:8000/mediapipe/level1/");
  const ids = ["mission", "demo", "how", "learn", "setup"];
  for (const id of ids) assert.ok((await page.locator("#" + id + " .example-stack").count()) > 0);
  const image = page.locator("#demo img");
  await image.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#demo img").naturalWidth === 1400);
  for (const attr of ["alt", "width", "height", "loading"]) assert.ok(await image.getAttribute(attr));
  const blocks = await page.locator("pre[data-code]").all();
  assert.equal(blocks.length, 4);
  for (const pre of blocks) {
    const original = await pre.locator(".line-content").allTextContents();
    await pre.locator("..").getByRole("button").click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied.replace(/\r\n/g, "\n"), original.join("\n"));
  }
  console.log("PASS 5 sections / 7 TODO / image / all 4 clipboard contents");
  for (const width of [375, 1920]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1080 });
    for (const theme of ["light", "dark"]) {
      if (await page.locator("html").getAttribute("data-theme") !== theme) await page.locator("[data-theme-toggle]").click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width === 375) {
        assert.ok(await page.locator("#setup pre").last().evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === "auto"));
      }
      const ratios = await page.evaluate(() => {
        const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
        function luminance(c) { return c.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0); }
        return [...document.querySelectorAll(".lecture-section .card p, .lecture-section .card h3, .lecture-section .callout p, .lecture-section .callout strong, .setup-versions li")].map(el => {
          let node = el;
          let bg;
          while (node) {
            bg = rgb(getComputedStyle(node).backgroundColor);
            if (bg.length === 3 || bg[3] === 1) break;
            node = node.parentElement;
          }
          const a = luminance(rgb(getComputedStyle(el).color));
          const b = luminance(bg);
          return (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
        });
      });
      assert.ok(Math.min(...ratios) >= 4.5, "contrast " + Math.min(...ratios));
      console.log("PASS", width, theme, "minimum card/callout contrast", Math.min(...ratios).toFixed(2));
      for (const id of ["learn", "setup"]) {
        await page.locator("#" + id).screenshot({ path: path.join(out, id + "-" + width + "-" + theme + ".png") });
      }
    }
    await page.goto("http://127.0.0.1:8000/mediapipe/level1/");
    await page.keyboard.press("p");
    for (const id of ids) {
      assert.equal(await page.locator(".is-presentation-section").getAttribute("id"), id);
      assert.ok(await page.locator(".is-presentation-section").evaluate(el => el.scrollWidth <= el.clientWidth));
      if (id === "setup") {
        for (const pre of await page.locator("#setup pre").all()) {
          assert.ok(await pre.evaluate(el => el.clientWidth <= el.closest(".is-presentation-section").clientWidth));
        }
      } else await page.keyboard.press("ArrowRight");
    }
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log("PASS presentation order / contained code at both widths / no browser errors");
  console.log("Screenshots:", out);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
