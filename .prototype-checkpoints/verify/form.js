// Usage: node form.js   Netlify Forms submission: payload + success message, and the email fallback on failure
const puppeteer = require(require('child_process').execSync('npm root -g').toString().trim() + '/puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms)); const res = []; const ok = (n, c, i) => res.push((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : ' ' + JSON.stringify(i)));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const mode of ['netlify-ok', 'netlify-down']) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.setViewport({ width: 1440, height: 900 });
    let posted = null;
    await p.setRequestInterception(true);
    p.on('request', r => {
      if (r.method() === 'POST') { posted = { url: r.url(), type: r.headers()['content-type'], body: r.postData() }; return r.respond({ status: mode === 'netlify-ok' ? 200 : 404, contentType: 'text/html', body: 'ok' }); }
      r.continue();
    });
    await p.goto('http://127.0.0.1:5173/prototype-wire.html?t=' + Date.now(), { waitUntil: 'networkidle0' }); await wait(500);
    const form = await p.evaluate(() => { const f = document.getElementById('call-form'); return { name: f.getAttribute('name'), netlify: f.hasAttribute('data-netlify'), hp: f.getAttribute('netlify-honeypot'), formName: f.elements['form-name'] && f.elements['form-name'].value, trapHidden: f.querySelector('.cf-trap').hidden }; });
    ok(mode + ' form is a Netlify form (name, data-netlify, form-name, hidden honeypot)', form.name === 'call' && form.netlify && form.hp === 'bot-field' && form.formName === 'call' && form.trapHidden, form);
    await p.evaluate(() => { TD.setTopic('Landing pages'); TD.openCall(); }); await wait(300);
    await p.type('[name=name]', 'Test Person'); await p.type('[name=email]', 'test@example.com'); await p.type('[name=website]', 'example.com'); await p.type('[name=message]', 'Lots of clicks, few calls');
    await p.click('#call-form [type=submit]'); await wait(800);
    const st = await p.evaluate(() => ({ msg: document.getElementById('cf-status').textContent, name: document.querySelector('[name=name]').value, topic: document.getElementById('cf-topic').value, btn: document.querySelector('#call-form [type=submit]').disabled }));
    const q = new URLSearchParams(posted && posted.body || '');
    ok(mode + ' posts urlencoded to / with every field', posted && new URL(posted.url).pathname === '/' && /x-www-form-urlencoded/.test(posted.type) && q.get('form-name') === 'call' && q.get('name') === 'Test Person' && q.get('email') === 'test@example.com' && q.get('website') === 'example.com' && q.get('message') === 'Lots of clicks, few calls' && q.get('topic') === 'Landing pages' && q.get('bot-field') === '', posted);
    if (mode === 'netlify-ok') ok(mode + ' thanks the visitor, clears the form, keeps the topic, re-enables the button', /Your request is in/.test(st.msg) && st.name === '' && st.topic === 'Landing pages' && !st.btn, st);
    else ok(mode + ' falls back to the pre-filled email', /email app/.test(st.msg) && st.name === 'Test Person' && !st.btn, st);
    ok(mode + ' no page errors', !errs.length, errs);
    await p.close();
  }
  console.log(res.join('\n')); console.log(res.filter(r => r.startsWith('PASS')).length + '/' + res.length + ' passed'); await b.close();
})();
