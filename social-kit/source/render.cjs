const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const started = Date.now();
  const base = path.resolve(__dirname, '..');
  const assets = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json')));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checks = [];
  for (const asset of assets) {
    await page.setViewportSize({ width: asset.width, height: asset.height });
    await page.goto(pathToFileURL(path.join(__dirname, 'artboards.html')).href + '?asset=' + asset.id);
    await page.evaluate(async () => { await Promise.all([document.fonts.load('500 32px Inter'), document.fonts.load('italic 300 32px Cormorant')]); await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
    const inspection = await page.evaluate(() => {
      const board = document.querySelector('.artboard.active');
      const b = board.getBoundingClientRect();
      const text = [...board.querySelectorAll('[data-critical]')].map(el => {
        const r = el.getBoundingClientRect();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const lines = [];
        while(walker.nextNode()) {
          if(!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(walker.currentNode);
          lines.push(...[...range.getClientRects()].map(q => ({left:q.left, top:q.top, right:q.right, bottom:q.bottom})));
        }
        return {text: el.textContent.trim(), x:r.x, y:r.y, width:r.width, height:r.height, lines, clipped: r.left < b.left || r.top < b.top || r.right > b.right || r.bottom > b.bottom || lines.some(q => q.left < b.left || q.top < b.top || q.right > b.right || q.bottom > b.bottom)};
      });
      const overlaps = [];
      for(let i=0; i<text.length; i++) for(let j=i+1; j<text.length; j++){
        const a=text[i], c=text[j];
        if(Math.min(a.x+a.width,c.x+c.width)>Math.max(a.x,c.x)+1 && Math.min(a.y+a.height,c.y+c.height)>Math.max(a.y,c.y)+1) overlaps.push([a.text,c.text]);
      }
      return { fontsLoaded: document.fonts.check('500 32px Inter') && document.fonts.check('italic 300 32px Cormorant'), width:b.width, height:b.height, imagesOkay: [...board.images || board.querySelectorAll('img')].every(img => img.naturalWidth > 0), text, overlaps };
    });
    if (inspection.text.some(item => item.clipped) || inspection.overlaps.length || !inspection.fontsLoaded || !inspection.imagesOkay) throw Error(asset.id + ': ' + JSON.stringify(inspection));
    await page.locator('#' + asset.id).screenshot({ path: path.join(base, 'upload', asset.file) });
    checks.push({ asset:asset.file, ...inspection });
  }
  await browser.close();
  if(errors.length) throw Error(errors.join('\n'));
  const report = { renderedAt: new Date().toISOString(), renderSeconds: Math.round((Date.now()-started)/100)/10, errors, checks };
  fs.writeFileSync(path.join(base, 'previews', 'verification.json'), JSON.stringify(report, null, 2));
  console.log(`Rendered ${assets.length} images; fonts and images loaded; no clipped text, overlapping text blocks or page errors. Render: ${report.renderSeconds}s.`);
})().catch(error => { console.error(error); process.exit(1); });
