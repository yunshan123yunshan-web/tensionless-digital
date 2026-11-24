const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const sourceDir = __dirname;
const kitDir = path.resolve(sourceDir, '..');
const uploadDir = path.join(kitDir, 'upload');
const previewsDir = path.join(kitDir, 'previews');
const htmlPath = path.join(sourceDir, 'artboards.html');
const assetsPath = path.join(sourceDir, 'assets.json');

function resolveChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean);
  const executablePath = candidates.find(candidate => fs.existsSync(candidate));
  if (!executablePath) throw new Error(`Google Chrome was not found. Checked:\n${candidates.join('\n')}`);
  return executablePath;
}

function ensureInputFiles(assets) {
  const shared = [
    'artboards.html',
    'logo-mark-light.png',
    'logo-mark-dark.png',
    'fonts/inter-400.woff2',
    'fonts/inter-500.woff2',
    'fonts/inter-600.woff2',
    'fonts/cg-300i.woff2',
  ];
  const generated = assets
    .filter(asset => !asset.id.startsWith('profile-'))
    .map(asset => asset.id === 'facebook-cover' ? 'generated/hero-wide.png' : `generated/${asset.id.replace('post-', '')}.png`);
  const missing = [...shared, ...generated].filter(relativePath => !fs.existsSync(path.join(sourceDir, relativePath)));
  if (missing.length) throw new Error(`Missing render inputs:\n${missing.map(file => `- ${file}`).join('\n')}`);
}

async function inspectArtboard(page, asset) {
  return page.evaluate(expected => {
    const board = document.querySelector('.artboard.active');
    const boardRect = board.getBoundingClientRect();
    const tolerance = 0.75;
    const rounded = number => Math.round(number * 100) / 100;
    const rectValue = rect => ({
      x: rounded(rect.x),
      y: rounded(rect.y),
      width: rounded(rect.width),
      height: rounded(rect.height),
      right: rounded(rect.right),
      bottom: rounded(rect.bottom),
    });

    const lineRects = element => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const rects = [];
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) rects.push(rectValue(rect));
      }
      return rects;
    };

    const criticalText = [...board.querySelectorAll('[data-critical]')].map(element => {
      const rect = rectValue(element.getBoundingClientRect());
      const lines = lineRects(element);
      const clipped = rect.x < -tolerance || rect.y < -tolerance || rect.right > boardRect.width + tolerance || rect.bottom > boardRect.height + tolerance || lines.some(line => line.x < -tolerance || line.y < -tolerance || line.right > boardRect.width + tolerance || line.bottom > boardRect.height + tolerance);
      return { text: element.textContent.replace(/\s+/g, ' ').trim(), ...rect, lines, clipped };
    });

    const collisionElements = [...board.querySelectorAll('[data-collision]')];
    const collisions = [];
    for (let index = 0; index < collisionElements.length; index += 1) {
      const first = collisionElements[index];
      const a = first.getBoundingClientRect();
      for (let next = index + 1; next < collisionElements.length; next += 1) {
        const second = collisionElements[next];
        if (first.contains(second) || second.contains(first)) continue;
        const b = second.getBoundingClientRect();
        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (overlapX > 1 && overlapY > 1) collisions.push({
          first: first.textContent.replace(/\s+/g, ' ').trim(),
          second: second.textContent.replace(/\s+/g, ' ').trim(),
          overlapX: rounded(overlapX),
          overlapY: rounded(overlapY),
        });
      }
    }

    const safeZone = { left: 220, top: 80, right: 1420, bottom: 590 };
    const safeZoneFailures = [...board.querySelectorAll('[data-safe]')]
      .map(element => ({ text: element.textContent.replace(/\s+/g, ' ').trim(), ...rectValue(element.getBoundingClientRect()) }))
      .filter(rect => rect.x < safeZone.left - tolerance || rect.y < safeZone.top - tolerance || rect.right > safeZone.right + tolerance || rect.bottom > safeZone.bottom + tolerance);

    const images = [...board.querySelectorAll('img')].map(image => ({
      source: image.getAttribute('src'),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      complete: image.complete,
    }));

    const profileLogo = board.querySelector('[data-profile-logo]');
    let profileLogoSafety = null;
    if (profileLogo) {
      const logoRect = profileLogo.getBoundingClientRect();
      const center = { x: boardRect.width / 2, y: boardRect.height / 2 };
      const safeRadius = Math.min(boardRect.width, boardRect.height) * 0.43;
      const corners = [
        { x: logoRect.left, y: logoRect.top },
        { x: logoRect.right, y: logoRect.top },
        { x: logoRect.left, y: logoRect.bottom },
        { x: logoRect.right, y: logoRect.bottom },
      ].map(point => ({ ...point, distance: rounded(Math.hypot(point.x - center.x, point.y - center.y)) }));
      profileLogoSafety = {
        safe: corners.every(corner => corner.distance <= safeRadius + tolerance),
        safeRadius: rounded(safeRadius),
        logoRect: rectValue(logoRect),
        corners,
      };
    }

    return {
      expected: { width: expected.width, height: expected.height },
      actual: { width: boardRect.width, height: boardRect.height },
      dimensionsOkay: boardRect.width === expected.width && boardRect.height === expected.height,
      fontsLoaded: document.fonts.check('400 24px Inter') && document.fonts.check('500 80px Inter') && document.fonts.check('600 20px Inter') && document.fonts.check('italic 300 80px Cormorant'),
      images,
      imagesOkay: images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0),
      criticalText,
      clippedText: criticalText.filter(item => item.clipped),
      collisions,
      safeZoneFailures,
      profileLogoSafety,
    };
  }, asset);
}

(async () => {
  const startedAt = Date.now();
  if (!fs.existsSync(assetsPath)) throw new Error(`Missing ${assetsPath}`);
  const assets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
  ensureInputFiles(assets);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(previewsDir, { recursive: true });

  const chromePath = resolveChrome();
  const pageErrors = [];
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1, colorScheme: 'dark' });
  page.on('pageerror', error => pageErrors.push(error.message));

  const checks = [];
  try {
    for (const asset of assets) {
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.goto(`${pathToFileURL(htmlPath).href}?asset=${encodeURIComponent(asset.id)}`, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await Promise.all([
          document.fonts.load('400 24px Inter'),
          document.fonts.load('500 80px Inter'),
          document.fonts.load('600 20px Inter'),
          document.fonts.load('italic 300 80px Cormorant'),
        ]);
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
      });

      const inspection = await inspectArtboard(page, asset);
      const failures = [];
      if (!inspection.dimensionsOkay) failures.push('incorrect artboard dimensions');
      if (!inspection.fontsLoaded) failures.push('one or more fonts failed to load');
      if (!inspection.imagesOkay) failures.push('one or more images failed to load');
      if (inspection.clippedText.length) failures.push('critical text is clipped');
      if (inspection.collisions.length) failures.push('text blocks overlap');
      if (inspection.safeZoneFailures.length) failures.push('cover content leaves the crop-safe zone');
      if (inspection.profileLogoSafety && !inspection.profileLogoSafety.safe) failures.push('profile logo leaves the circular safe area');
      if (failures.length) throw new Error(`${asset.id}: ${failures.join('; ')}\n${JSON.stringify(inspection, null, 2)}`);

      const uploadPath = path.join(uploadDir, asset.file);
      const previewPath = path.join(previewsDir, `${path.parse(asset.file).name}-preview.jpg`);
      await page.locator(`#${asset.id}`).screenshot({ path: uploadPath, type: 'png' });
      await page.locator(`#${asset.id}`).screenshot({ path: previewPath, type: 'jpeg', quality: 88 });
      checks.push({ id: asset.id, file: asset.file, preview: path.basename(previewPath), ...inspection });
    }
  } finally {
    await browser.close();
  }

  if (pageErrors.length) throw new Error(`Page errors:\n${pageErrors.join('\n')}`);
  const report = {
    renderedAt: new Date().toISOString(),
    renderSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
    chrome: chromePath,
    pageErrors,
    checks,
  };
  fs.writeFileSync(path.join(previewsDir, 'verification.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Rendered ${checks.length} assets in ${report.renderSeconds}s. Fonts and images loaded; no clipped text, collisions, or crop-safe violations.`);
})().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
