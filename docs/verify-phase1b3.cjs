const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

(async () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../level1/index.html"), "utf8");
  const todo = [...html.matchAll(/<!-- TODO:/g)];
  assert.equal(todo.length, 0);
  for (const id of []) {
    const section = html.match(new RegExp('<section class="lecture-section" id="' + id + '"[\\s\\S]*?</section>'))[0];
    assert.ok(section.includes("<!-- TODO:"));
    assert.equal((section.match(/<p/g) || []).length, 1);
  }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "mediapipe-phase1b3-"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"], reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) errors.push(r.url()); });
  await page.goto("http://127.0.0.1:8000/mediapipe/level1/");
  const ids = ["mission", "demo", "how", "learn", "setup", "step1", "opencv", "step2", "landmarks", "step3", "tournament", "extend"];
  for (const id of ids) assert.ok((await page.locator("#" + id + " .example-stack").count()) > 0);
  const image = page.locator("#demo img");
  await image.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#demo img").naturalWidth === 1400);
  for (const attr of ["alt", "width", "height", "loading"]) assert.ok(await image.getAttribute(attr));

  for (const pre of await page.locator("pre[data-source]").all()) {
    const name = await pre.getAttribute("data-source");
    let source = fs.readFileSync(path.resolve(__dirname, "../level1", name), "utf8").replace(/\r\n/g, "\n");
    const range = await pre.getAttribute("data-source-lines");
    if (range) {
      const [start, end] = range.split("-").map(Number);
      source = source.split("\n").slice(start - 1, end).join("\n");
    }
    assert.equal((await pre.locator(".line-content").allTextContents()).join("\n"), source, name);
  }
  for (const id of ["opencv", "step2", "landmarks"]) {
    const img = page.locator("#" + id + " img");
    await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(id => document.querySelector("#" + id + " img").naturalWidth > 0, id);
    for (const attr of ["alt", "width", "height", "loading"]) assert.ok(await img.getAttribute(attr));
  }
  for (const name of ["requirements.txt", "test_install.py", "korean_text.py", "final.py", "03angle_01.py", "04count_01.py"]) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('a[download][href="files/' + name + '"]').first().click()
    ]);
    assert.equal(download.suggestedFilename(), name);
    const saved = await download.path();
    assert.equal(fs.readFileSync(saved, "utf8"), fs.readFileSync(path.resolve(__dirname, "../level1/files", name), "utf8"));
  }
  console.log("PASS exact source blocks and downloaded file bytes");
  assert.equal(await page.locator("#step3 img").count(), 3);
  for (const img of await page.locator("#step3 img").all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
    assert.ok(await img.evaluate(el => el.naturalWidth > 0));
    for (const attr of ["alt", "width", "height", "loading"]) assert.ok(await img.getAttribute(attr));
  }

  const preview = page.locator("[data-level2-preview]");
  assert.equal(await preview.getAttribute("aria-disabled"), "true");
  assert.equal(await preview.getAttribute("href"), null);
  const beforeURL = page.url();
  await preview.click({ force: true });
  assert.equal(page.url(), beforeURL);
  assert.equal(await page.locator("[data-widget]").count(), 0);
  assert.ok(!/arctan2/i.test(html));
  const blocks = await page.locator("pre[data-code]").all();
  assert.equal(blocks.length, 19);
  for (const pre of blocks) {
    const original = await pre.locator(".line-content").allTextContents();
    await pre.locator("..").getByRole("button").click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied.replace(/\r\n/g, "\n"), original.join("\n"));
  }
  console.log("PASS 12 sections / 0 TODO / images / all 19 clipboard contents");
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
      for (const id of ["tournament", "extend"]) {
        await page.locator("#" + id).screenshot({ path: path.join(out, id + "-" + width + "-" + theme + ".png"), style: ".site-header, .skip-link { visibility: hidden !important; }" });
      }
      if (width === 1920 && theme === "light") {
        const figures = await page.locator("#step3 figure").all();
        for (let i = 0; i < figures.length; i++) {
          await figures[i].screenshot({ path: path.join(out, "math-figure-" + i + ".png"), style: ".site-header, .skip-link, .scroll-progress { visibility: hidden !important; }" });
        }
      }
    }
    await page.goto("http://127.0.0.1:8000/mediapipe/level1/");
    await page.keyboard.press("p");
    for (const id of ids) {
      assert.equal(await page.locator(".is-presentation-section").getAttribute("id"), id);
      assert.ok(await page.locator(".is-presentation-section").evaluate(el => el.scrollWidth <= el.clientWidth));
      if (["setup", "step1", "step2", "landmarks", "step3"].includes(id)) {
        for (const pre of await page.locator("#" + id + " pre").all()) {
          assert.ok(await pre.evaluate(el => el.clientWidth <= el.closest(".is-presentation-section").clientWidth));
          assert.ok(await pre.evaluate(el => el.getBoundingClientRect().height <= Math.min(innerHeight * .42, 420) + 1));
          assert.equal(await pre.evaluate(el => getComputedStyle(el).overflowY), "auto");
        }
      }
      if (id !== ids.at(-1)) await page.keyboard.press("ArrowRight");
    }
    const visited = await page.evaluate(() => JSON.parse(localStorage.getItem("lecture-progress:level1")));
    assert.deepEqual([...visited].sort(), [...ids].sort());
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log("PASS presentation order / contained code at both widths / no browser errors");
  console.log("Screenshots:", out);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
