const { chromium } = require('playwright');

const VIEWPORT = { width: 1440, height: 900 };
const URL = process.argv[2] || 'http://127.0.0.1:5173/index.html';

// Current Liquid Chrome palette (styles.css :root):
//   --bg     #050507  -> body
//   --bg-sec rgba(5,5,7,.88) -> every .sec / .imm-pin-wrap / .cta-sec
//   --bg-deep #040406 -> marquee + footer
const EXPECTED = {
  body:   'rgb(5, 5, 7)',
  bgSec:  'rgba(5, 5, 7, 0.88)',
  bgDeep: 'rgb(4, 4, 6)',
};

async function bg(page, sel) {
  return page.$eval(sel, el => getComputedStyle(el).backgroundColor);
}

// html { scroll-behavior: smooth } fights scrollTo sampling — disable it in-test
// (mirrors verify-audit-regressions.js) so ScrollTrigger reads deterministic positions.
async function scrollTo(page, y) {
  await page.evaluate(sy => { window.scrollTo(0, sy); window.ScrollTrigger && window.ScrollTrigger.update(); }, y);
  await page.waitForTimeout(1100);
}

// Crossfade sections (Testimonials, Process): at most one scene with opacity > 0.05.
async function checkOpacityScenes(page, sectionId, sel, scrollFraction) {
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await scrollTo(page, Math.floor(maxScroll * scrollFraction));
  const opacities = await page.evaluate(s => {
    return Array.from(document.querySelectorAll(s)).map(el => parseFloat(getComputedStyle(el).opacity));
  }, sel);
  const visible = opacities.filter(o => o > 0.05).length;
  const data = opacities.map((o, i) => `S${i}:${o.toFixed(2)}`).join(', ');
  const pass = visible <= 1;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${sectionId} @${(scrollFraction * 100).toFixed(0)}%: ${data}`);
  return pass;
}

// Horizontal reel (Case Study): slides never overlap — they translate past each
// other in a 400vw track, so at rest exactly one fills the viewport and during a
// scrub transition at most two straddle it. Count slides whose rect intersects the
// full viewport rect (horizontal AND vertical — a scrolled-off slide has a
// negative top and must NOT count).
async function checkReelScenes(page, sectionId, scrollY) {
  await scrollTo(page, scrollY);
  const info = await page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    return Array.from(document.querySelectorAll('.cs-slide')).map(sl => {
      const r = sl.getBoundingClientRect();
      return r.left < vw && r.right > 0 && r.top < vh && r.bottom > 0;
    });
  });
  const count = info.filter(Boolean).length;
  const pass = count <= 2;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${sectionId} @scrollY=${scrollY}: ${count} slide(s) in viewport`);
  return pass;
}

// Sample just before a pinned section releases (its own scenes must be fully
// cleared so the next section enters over a clean background, never mid-content).
async function checkSpillover(page, sectionId, sel, pinEnd) {
  await scrollTo(page, pinEnd - 40);
  const res = await page.evaluate(s => {
    return Array.from(document.querySelectorAll(s)).map(el => parseFloat(getComputedStyle(el).opacity));
  }, sel);
  const visible = res.filter(o => o > 0.05).length;
  const data = res.map((o, i) => `S${i}:${o.toFixed(2)}`).join(', ');
  const pass = visible === 0;
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${sectionId} release: ${data} ${pass ? '' : '(content still visible at pin end)'}`);
  return pass;
}

// Live pin ends from ScrollTrigger (geometry-independent).
async function pinEnds(page) {
  return page.evaluate(() => {
    const out = {};
    (window.ScrollTrigger.getAll() || []).forEach(st => {
      if (!st.pin) return;
      const id = st.trigger && st.trigger.id ? st.trigger.id : null;
      if (id && typeof st.end === 'number') out[id] = st.end;
    });
    return out;
  });
}

(async () => {
  console.log('\n=== Tensionless Digital — Playwright Visual Audit ===\n');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });

  // --- 1. Console errors ---
  console.log('--- 1. Console Errors ---');
  console.log(`  ${consoleErrors.length === 0 ? 'PASS: No console errors' : `FAIL: ${consoleErrors.length} errors\n  ` + consoleErrors.join('\n  ')}\n`);

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`  Page height: ${pageHeight}px\n`);

  // --- 2. GSAP / ScrollTrigger ---
  console.log('--- 2. GSAP / ScrollTrigger ---');
  console.log(`  GSAP: ${await page.evaluate(() => typeof gsap !== 'undefined') ? 'YES' : 'NO'}`);
  console.log(`  ScrollTrigger: ${await page.evaluate(() => typeof ScrollTrigger !== 'undefined') ? 'YES' : 'NO'}`);
  console.log(`  gsap-active: ${await page.evaluate(() => document.documentElement.classList.contains('gsap-active')) ? 'YES' : 'NO'}\n`);

  // --- 3. Section backgrounds ---
  console.log('--- 3. Section Background Colors ---');
  const checks = [
    { sel: '#services',          label: 'Services',     expected: EXPECTED.bgSec },
    { sel: '#data-break',        label: 'Data Break',   expected: EXPECTED.bgSec },
    { sel: '#clients',           label: 'Marquee',      expected: EXPECTED.bgDeep },
    { sel: '#case-study',        label: 'Case Study',   expected: EXPECTED.bgSec },
    { sel: '#testimonials-imm',  label: 'Testimonials', expected: EXPECTED.bgSec },
    { sel: '#process-imm',       label: 'Process',      expected: EXPECTED.bgSec },
    { sel: '.cta-sec',           label: 'CTA',          expected: EXPECTED.bgSec },
    { sel: 'footer',             label: 'Footer',       expected: EXPECTED.bgDeep },
  ];
  let pass = 0, fail = 0;
  for (const { sel, label, expected } of checks) {
    if (await page.$(sel)) {
      const b = await bg(page, sel);
      const ok = b === expected;
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${b}${ok ? '' : ` (expected ${expected})`}`);
      ok ? pass++ : fail++;
    } else {
      console.log(`  SKIP  ${label}: selector not found`);
    }
  }
  console.log(`  Backgrounds: ${pass} pass, ${fail} fail\n`);

  // --- 4. Hero at scroll 0 ---
  console.log('--- 4. Hero at Scroll 0 ---');
  await scrollTo(page, 0);
  if (await page.$('#chrome-shader')) {
    const vis = await page.evaluate(() => {
      const c = document.querySelector('#chrome-shader');
      const s = getComputedStyle(c);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0;
    });
    console.log(`  Chrome-shader canvas visible: ${vis ? 'YES' : 'NO'}\n`);
  }

  // --- 5. Pinned scene overlap (at most one scene / ≤2 reel slides) ---
  console.log('--- 5. Scene Overlap ---');
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const frac = f => Math.floor(maxScroll * f);
  const overlaps = [];
  overlaps.push(await checkReelScenes(page, 'Case Study', frac(0.47)));
  overlaps.push(await checkReelScenes(page, 'Case Study', frac(0.53)));
  overlaps.push(await checkReelScenes(page, 'Case Study', frac(0.58)));
  overlaps.push(await checkOpacityScenes(page, 'Testimonials', '.testi-scene', 0.68));
  overlaps.push(await checkOpacityScenes(page, 'Testimonials', '.testi-scene', 0.74));
  overlaps.push(await checkOpacityScenes(page, 'Testimonials', '.testi-scene', 0.78));
  overlaps.push(await checkOpacityScenes(page, 'Process', '.proc-step', 0.82));
  overlaps.push(await checkOpacityScenes(page, 'Process', '.proc-step', 0.86));
  overlaps.push(await checkOpacityScenes(page, 'Process', '.proc-step', 0.90));

  // --- 6. Spillover (last scene clears before the pin releases) ---
  console.log('\n--- 6. Section Spillover ---');
  const pins = await pinEnds(page);
  const spill = [];
  spill.push(await checkReelScenes(page, 'Case Study release', pins['case-study']));
  spill.push(await checkSpillover(page, 'Testimonials release', '.testi-scene', pins['testimonials-imm']));
  spill.push(await checkSpillover(page, 'Process release', '.proc-step', pins['process-imm']));

  // --- 7. Services reveal ---
  console.log('\n--- 7. Services Reveal ---');
  await scrollTo(page, Math.floor(await page.evaluate(() => document.documentElement.scrollHeight) * 0.35));
  const svcVisible = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#services .svc-card')).filter(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05;
    }).length;
  });
  console.log(`  Services cards visible: ${svcVisible}/6 ${svcVisible === 6 ? 'PASS' : 'FAIL'}\n`);

  // --- 8. CTA / Footer ---
  console.log('--- 8. CTA / Footer ---');
  await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
  const ctaBg = await bg(page, '.cta-sec');
  const footBg = await bg(page, 'footer');
  console.log(`  CTA background: ${ctaBg} ${ctaBg === EXPECTED.bgSec ? 'PASS' : 'FAIL'}`);
  console.log(`  Footer background: ${footBg} ${footBg === EXPECTED.bgDeep ? 'PASS' : 'FAIL'}\n`);

  // --- 9. Mobile (390x844) ---
  console.log('--- 9. Mobile (390x844) ---');
  const mc = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mc.newPage();
  const merr = [];
  mp.on('pageerror', e => merr.push(e.message));
  await mp.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await mp.waitForTimeout(1200);
  const sections = ['hero-pin', 'services', 'data-break', 'clients', 'case-study', 'testimonials-imm', 'process-imm', 'contact'];
  let found = 0, withFooter = 0;
  for (const s of sections) {
    const el = await mp.$(`#${s}`);
    if (el) {
      found++;
      if (await mp.evaluate(el => getComputedStyle(el).display !== 'none', el)) withFooter++;
    }
  }
  const noOverflow = await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  console.log(`  Sections visible: ${withFooter}/${sections.length} ${withFooter === sections.length ? 'PASS' : 'FAIL'}`);
  console.log(`  Horizontal overflow: ${noOverflow ? 'none (PASS)' : 'PRESENT (FAIL)'}`);
  console.log(`  Mobile errors: ${merr.length === 0 ? '0 (PASS)' : merr.length}`);
  await mc.close();

  const allPass = consoleErrors.length === 0 && pass === checks.length && fail === 0 &&
    overlaps.every(Boolean) && spill.every(Boolean) && svcVisible === 6 &&
    ctaBg === EXPECTED.bgSec && footBg === EXPECTED.bgDeep &&
    withFooter === sections.length && noOverflow && merr.length === 0;
  console.log(`\n=== Audit ${allPass ? 'PASS' : 'FAIL'} ===\n`);
  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
