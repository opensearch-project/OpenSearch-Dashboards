/*
 * Baseline OSD browser regression check (the "old way must still work" gate).
 * Usage:  NODE_PATH=~/node_modules node harness/verify_baseline.js
 * Env:    OSD_URL (default http://localhost:5601)
 * Exits non-zero if any core app page fails to render or throws page errors.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../..');
const BASE = process.env.OSD_URL || 'http://localhost:5601';
const OUT = process.env.SHOT_DIR || path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', '/app/home'],
  ['discover', '/app/discover'],
  ['dashboards', '/app/dashboards'],
  ['visualize', '/app/visualize'],
  ['dev_tools', '/app/dev_tools'],
  ['management', '/app/management'],
  ['savedObjects', '/app/management/opensearch-dashboards/objects'],
  ['advancedSettings', '/app/management/opensearch-dashboards/settings'],
];
const ERR_STRINGS = [
  'Application Not Found',
  'OpenSearch Dashboards server is not ready',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // prime + dismiss welcome modal
  await page.goto(BASE + '/app/home', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 45000 }).catch(() => {});
  for (const sel of ['[data-test-subj="homeWelcomeDismissButton"]', 'text=Dismiss']) {
    try { const el = await page.$(sel); if (el) { await el.click({ timeout: 1500 }); } } catch (_) {}
  }

  const results = [];
  for (const [id, path] of PAGES) {
    const pageErrors = [];
    const onErr = (e) => pageErrors.push(String(e));
    page.on('pageerror', onErr);
    let httpStatus = 0, navOk = true;
    try { const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 }); httpStatus = r ? r.status() : 0; }
    catch (_) { navOk = false; }
    await page.waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const body = (await page.evaluate(() => (document.querySelector('#opensearch-dashboards-body') || document.body).innerText).catch(() => '')).replace(/\s+/g, ' ').trim();
    const errHit = ERR_STRINGS.filter((s) => body.includes(s));
    await page.screenshot({ path: `${OUT}/${id}.png` }).catch(() => {});
    const ok = navOk && httpStatus < 400 && pageErrors.length === 0 && errHit.length === 0 && body.length > 40;
    results.push({ id, ok, httpStatus, pageErrors: pageErrors.length, errHit, len: body.length });
    page.off('pageerror', onErr);
  }
  await browser.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} http=${r.httpStatus} perr=${r.pageErrors} len=${r.len}${r.errHit.length ? ' ERR=' + JSON.stringify(r.errHit) : ''}`);
  console.log(`BASELINE ${failed.length === 0 ? 'OK' : 'FAILED'} (${results.length - failed.length}/${results.length} pass)`);
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
