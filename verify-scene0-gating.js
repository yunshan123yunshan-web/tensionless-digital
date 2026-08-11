/**
 * Playwright check (this project has no unit test runner — static HTML/CSS/JS
 * site, verification is browser-state based per CLAUDE.md).
 *
 * Regression check for: pinned-scene wrappers that carry `scene-active` in
 * markup (.testi-s1, .proc-step[0]) render at opacity:1 from page load via
 * a CSS default rule, before their own ScrollTrigger pin has ever engaged.
 * This causes their empty panel backgrounds to visually double-expose with
 * whatever section precedes them.
 *
 * Run: node "verify-scene0-gating.js" (requires local server on :5173)
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://127.0.0.1:5173/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const s1 = document.querySelector('.testi-s1');
    const step0 = document.querySelectorAll('.proc-step')[0];
    return {
      testiS1Opacity: s1 ? +getComputedStyle(s1).opacity : null,
      procStep0Opacity: step0 ? +getComputedStyle(step0).opacity : null,
    };
  });

  const pass = result.testiS1Opacity === 0 && result.procStep0Opacity === 0;
  console.log('At page load, no scroll — both scene-active wrappers must be hidden:');
  console.log('  .testi-s1 opacity:', result.testiS1Opacity, '(expect 0)');
  console.log('  .proc-step[0] opacity:', result.procStep0Opacity, '(expect 0)');
  console.log(pass ? 'PASS' : 'FAIL');

  await browser.close();
  process.exit(pass ? 0 : 1);
})();
