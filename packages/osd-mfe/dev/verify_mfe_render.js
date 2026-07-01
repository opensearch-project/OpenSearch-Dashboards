/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * MFE end-to-end render proof.
 *
 * Loads the OSD `--mfe` instance on :5602 in headless Chromium (Playwright) and
 * proves the UI actually boots from Module Federation remotes served by the
 * origin (:8080), NOT from local plugin bundles:
 *
 *   - dismisses the home welcome modal,
 *   - navigates the core app pages (home, discover, dashboards, management) and
 *     asserts each renders the global nav with ZERO page errors,
 *   - captures the network and asserts at least one plugin `remoteEntry.js` was
 *     fetched from the origin (http://localhost:8080/mfe/<id>/remoteEntry.js),
 *     and that the shared-deps + bootstrap bundles also came from the origin,
 *   - saves a screenshot per page under harness/shots/mfe/.
 *
 * This is the MFE counterpart to verify_baseline.js (the old-way :5601 gate).
 *
 * Usage:  source harness/env.sh && node harness/verify_mfe_render.js
 * Env:    MFE_OSD_URL (default http://localhost:5602)
 *         REGISTRY_BASE_URL (origin, default http://localhost:8080)
 *         SHOT_DIR (default harness/shots/mfe)
 * Exit:   0 = pass, 1 = render/assertion failure, 2 = fatal.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.MFE_OSD_URL || 'http://localhost:5602';
// The origin the remotes/shared-deps/bootstrap are served from. Normalise
// localhost/127.0.0.1 so either spelling counts as "from the origin".
const ORIGIN = (process.env.REGISTRY_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const ORIGIN_PORT = (ORIGIN.match(/:(\d+)/) || [])[1] || '8080';
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../..');
const OUT =
  process.env.SHOT_DIR ||
  path.join(__dirname, 'shots/mfe');
fs.mkdirSync(OUT, { recursive: true });

// The four core pages the story requires (>=4 render with 0 page errors).
const PAGES = [
  ['home', '/app/home'],
  ['discover', '/app/discover'],
  ['dashboards', '/app/dashboards'],
  ['management', '/app/management'],
];

const ERR_STRINGS = ['Application Not Found', 'OpenSearch Dashboards server is not ready'];

// A request URL is "from the origin" if it targets the origin host:port (accept
// both localhost and 127.0.0.1 spellings of the same local origin).
function fromOrigin(url) {
  return (
    url.startsWith(ORIGIN) ||
    url.includes(`localhost:${ORIGIN_PORT}/`) ||
    url.includes(`127.0.0.1:${ORIGIN_PORT}/`)
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ---- network capture (session-wide; set up BEFORE first navigation) ----
  const remoteEntryHits = []; // plugin remoteEntry.js fetched from the origin
  const sharedDepsHits = []; // shared-deps bundle fetched from the origin
  const bootstrapHits = []; // MFE bootstrap bundle fetched from the origin
  const originFailures = []; // any failed/4xx-5xx request to the origin
  const allConsoleErrors = [];

  page.on('response', (resp) => {
    const url = resp.url();
    const status = resp.status();
    if (!fromOrigin(url)) return;
    if (status >= 400) {
      originFailures.push(`HTTP ${status} ${url}`);
      return;
    }
    if (/\/mfe\/[^/]+\/remoteEntry\.js(\?|$)/.test(url)) remoteEntryHits.push(url);
    else if (/\/shared-deps\//.test(url)) sharedDepsHits.push(url);
    else if (/\/bootstrap\//.test(url)) bootstrapHits.push(url);
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (fromOrigin(url)) {
      originFailures.push(`FAILED ${req.method()} ${url} — ${req.failure() && req.failure().errorText}`);
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') allConsoleErrors.push(msg.text());
  });

  // ---- prime + dismiss welcome modal ----
  await page.goto(BASE + '/app/home', { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
  await page.waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 90000 }).catch(() => {});
  for (const sel of ['[data-test-subj="homeWelcomeDismissButton"]', 'text=Dismiss']) {
    try {
      const el = await page.$(sel);
      if (el) await el.click({ timeout: 1500 });
    } catch (_) {}
  }

  // ---- per-page render checks ----
  const results = [];
  for (const [id, p] of PAGES) {
    const pageErrors = [];
    const onErr = (e) => pageErrors.push(String(e && e.stack ? e.stack : e));
    page.on('pageerror', onErr);

    let httpStatus = 0;
    let navOk = true;
    try {
      const r = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
      httpStatus = r ? r.status() : 0;
    } catch (_) {
      navOk = false;
    }
    await page.waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3500);

    // The app actually booted only if the global nav chrome is present. If the
    // MFE bootstrap was blocked/failed, the page is stuck on the loading shell
    // (a tiny body, no nav), so require BOTH the nav element and a real body.
    const navPresent = (await page.$('[data-test-subj="headerGlobalNav"]')) !== null;
    const body = (
      await page
        .evaluate(() => (document.querySelector('#opensearch-dashboards-body') || document.body).innerText)
        .catch(() => '')
    )
      .replace(/\s+/g, ' ')
      .trim();
    const errHit = ERR_STRINGS.filter((s) => body.includes(s));
    await page.screenshot({ path: `${OUT}/${id}.png` }).catch(() => {});

    const ok =
      navOk &&
      httpStatus < 400 &&
      pageErrors.length === 0 &&
      errHit.length === 0 &&
      navPresent &&
      body.length > 200;
    results.push({ id, ok, httpStatus, pageErrors, errHit, len: body.length, navPresent });
    page.off('pageerror', onErr);
  }

  await browser.close();

  // ---- report ----
  const failedPages = results.filter((r) => !r.ok);
  console.log('--- MFE render verification (:%s, origin %s) ---', BASE.replace(/^https?:\/\//, ''), ORIGIN);
  for (const r of results) {
    console.log(
      `${r.ok ? 'PASS' : 'FAIL'} ${r.id} http=${r.httpStatus} perr=${r.pageErrors.length} nav=${r.navPresent} len=${r.len}` +
        (r.errHit.length ? ' ERR=' + JSON.stringify(r.errHit) : '')
    );
    r.pageErrors.forEach((e) => console.log('   PAGEERROR ' + e));
  }

  const uniq = (a) => Array.from(new Set(a));
  const remoteEntryPlugins = uniq(
    remoteEntryHits.map((u) => (u.match(/\/mfe\/([^/]+)\/remoteEntry\.js/) || [])[1]).filter(Boolean)
  );
  console.log('');
  console.log(`network: plugin remoteEntry.js from origin : ${remoteEntryHits.length} request(s), ${remoteEntryPlugins.length} unique plugin(s)`);
  console.log(`         e.g. ${remoteEntryPlugins.slice(0, 8).join(', ')}${remoteEntryPlugins.length > 8 ? ', …' : ''}`);
  console.log(`network: shared-deps from origin           : ${sharedDepsHits.length} request(s)`);
  console.log(`network: bootstrap bundle from origin      : ${bootstrapHits.length} request(s)`);
  console.log(`network: origin failures (4xx/5xx/failed)   : ${originFailures.length}`);
  originFailures.slice(0, 20).forEach((e) => console.log('   ' + e));
  if (allConsoleErrors.length) {
    console.log(`console errors (informational)             : ${allConsoleErrors.length}`);
    allConsoleErrors.slice(0, 10).forEach((e) => console.log('   CONSOLE.ERROR ' + e));
  }

  // ---- assertions (story completion criteria) ----
  const assertions = [];
  assertions.push(['>=4 core pages render with 0 page errors', failedPages.length === 0 && results.length >= 4]);
  assertions.push(['>=1 plugin remoteEntry.js loaded from origin :' + ORIGIN_PORT, remoteEntryHits.length >= 1]);
  assertions.push(['MFE bootstrap bundle loaded from origin', bootstrapHits.length >= 1]);
  assertions.push(['shared-deps loaded from origin', sharedDepsHits.length >= 1]);
  assertions.push(['no failed origin requests', originFailures.length === 0]);

  console.log('');
  let pass = true;
  for (const [label, ok] of assertions) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
    if (!ok) pass = false;
  }
  console.log('');
  console.log(`screenshots: ${OUT}`);
  console.log(`MFE_RENDER ${pass ? 'OK' : 'FAILED'} (${results.length - failedPages.length}/${results.length} pages, ${remoteEntryHits.length} remoteEntry hits)`);
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(2);
});
