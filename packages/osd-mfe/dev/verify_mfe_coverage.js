/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 6, Story 3 — FULL COVERAGE proof for the OSD `--mfe` instance (:5602).
 *
 * The Phase-3/4 render verifiers (verify_mfe_render.js / verify_mfe_cdn.js) prove
 * a representative subset: 4 core pages + ">=1 remoteEntry loaded". This script
 * proves the STRONGER, exhaustive Phase-6 claim required to close the project:
 *
 *   1. ALL listed core app pages render in `--mfe` mode with ZERO page errors:
 *        home, discover, dashboards, visualize, dev_tools, management,
 *        savedObjects, indexPatterns, advancedSettings, vis-builder,
 *        opensearch_dashboards_overview, opensearch_management_overview
 *      (global nav present, no "Application Not Found", real body), and
 *   2. ALL plugin remotes declared in registry/registry.json (the 58 MFEs) are
 *      reachable / loaded with NO failed remoteEntry (no 403/404/failed):
 *        - any remote whose remoteEntry.js is requested while navigating the
 *          pages above is recorded as "loaded" (and its HTTP status checked), and
 *        - any remote NOT exercised by those pages (Module Federation loads
 *          remotes lazily, so a 12-page tour will not touch all 58) is probed
 *          directly with a read-only GET of its registry remoteEntry URL to
 *          confirm reachability (status < 400).
 *
 * It works against whichever registry is currently active (canonical CDN or the
 * local :8080 origin): the remoteEntry URLs are read straight from
 * registry/registry.json, and observed hits are matched by `/remoteEntry.js/`
 * regardless of host (mirrors verify_mfe_cdn.js's host-agnostic matchers).
 *
 * This script is READ-ONLY: it makes no AWS calls and writes only screenshots
 * (one per page, under harness/shots/e2e/).
 *
 * Usage:  source harness/env.sh && node harness/verify_mfe_coverage.js
 * Env:    MFE_OSD_URL    (default http://localhost:5602)
 *         REGISTRY_PATH  (default <workspace>/registry/registry.json)
 *         SHOT_DIR       (default <workspace>/harness/shots/e2e)
 *         EXPECTED_REMOTES (default 58 — informational sanity assertion)
 * Exit:   0 = pass, 1 = render/coverage assertion failure, 2 = fatal.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Playwright is installed under NODE_PATH (see env.sh); require the same way the
// sibling verifiers (verify_mfe_render.js / verify_mfe_cdn.js) do.
const { chromium } = require('playwright');

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../..');
const BASE = (process.env.MFE_OSD_URL || 'http://localhost:5602').replace(/\/+$/, '');
const REGISTRY_PATH =
  process.env.REGISTRY_PATH || process.env.MFE_REGISTRY_PATH ||
  path.join(WORKSPACE_DIR, 'registry', 'registry.json');
const OUT = process.env.SHOT_DIR || path.join(__dirname, 'shots', 'e2e');
const EXPECTED_REMOTES = Number(process.env.EXPECTED_REMOTES || 58);
fs.mkdirSync(OUT, { recursive: true });

// ALL core app pages the story requires (each must render with 0 page errors).
// Routes for the management sub-sections (savedObjects/indexPatterns/
// advancedSettings/opensearch_management_overview) follow the OSD management app
// layout; the standalone apps use /app/<appId>. A wrong route surfaces as
// "Application Not Found" (in ERR_STRINGS) and FAILS that page loudly.
const PAGES = [
  ['home', '/app/home'],
  ['discover', '/app/discover'],
  ['dashboards', '/app/dashboards'],
  ['visualize', '/app/visualize'],
  ['dev_tools', '/app/dev_tools'],
  ['management', '/app/management'],
  ['savedObjects', '/app/management/opensearch-dashboards/objects'],
  ['indexPatterns', '/app/management/opensearch-dashboards/indexPatterns'],
  ['advancedSettings', '/app/management/opensearch-dashboards/settings'],
  ['vis-builder', '/app/vis-builder'],
  ['opensearch_dashboards_overview', '/app/opensearch_dashboards_overview'],
  ['opensearch_management_overview', '/app/management/opensearch-dashboards/overview'],
];

const ERR_STRINGS = ['Application Not Found', 'OpenSearch Dashboards server is not ready'];

// A request is a plugin remoteEntry.js fetch (regardless of host). Matches both
// the CDN layout (/mfe/<id>/<hash>/remoteEntry.js) and the local layout
// (/mfe/<id>/remoteEntry.js). (Identical to verify_mfe_cdn.js.)
function isRemoteEntry(url) {
  return /\/remoteEntry\.js(\?|$)/.test(url);
}

// Extract the plugin id from a remoteEntry URL for both layouts. The id equals
// the registry key (the CDN URL is /mfe/<key>/<hash>/remoteEntry.js).
function pluginIdFromUrl(url) {
  const cdn = url.match(/\/mfe\/([^/]+)\/[^/]+\/remoteEntry\.js/);
  if (cdn) return cdn[1];
  const local = url.match(/\/mfe\/([^/]+)\/remoteEntry\.js/);
  return local ? local[1] : undefined;
}

function loadRegistry() {
  const raw = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  // Registry is `schemaVersion: 1` (the unified layered shape): plugin
  // entries live under `default.mfes` (rollouts/tenantOverrides add layered
  // siblings, but the coverage smoke checks the BASELINE every host sees,
  // which is exactly the default layer).
  const mfes =
    raw && raw.default && raw.default.mfes
      ? raw.default.mfes
      : {};
  // name -> remoteEntry URL, in stable (sorted) order for a tidy table.
  return Object.keys(mfes)
    .sort()
    .map((name) => ({ name, remoteEntry: mfes[name] && mfes[name].remoteEntry }));
}

(async () => {
  const remotes = loadRegistry();
  if (remotes.length === 0) {
    // eslint-disable-next-line no-console
    console.error('FATAL: no remotes found in registry ' + REGISTRY_PATH);
    process.exit(2);
  }

  // eslint-disable-next-line no-console
  console.log('--- MFE full-coverage verification ---');
  // eslint-disable-next-line no-console
  console.log('  osd          = ' + BASE);
  // eslint-disable-next-line no-console
  console.log('  registry     = ' + REGISTRY_PATH);
  // eslint-disable-next-line no-console
  console.log('  pages        = ' + PAGES.length);
  // eslint-disable-next-line no-console
  console.log('  remotes      = ' + remotes.length + ' (expected ' + EXPECTED_REMOTES + ')');
  // eslint-disable-next-line no-console
  console.log('  screenshots  = ' + OUT);
  // eslint-disable-next-line no-console
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ---- network capture (session-wide; set up BEFORE first navigation) ----
  // pluginId -> { statuses:Set, loaded:bool } observed during page navigation.
  const observed = new Map();
  const remoteEntryFailures = []; // failed/4xx-5xx remoteEntry requests (any host)
  const allConsoleErrors = [];

  const noteRemote = (id, status, ok) => {
    if (!id) return;
    const e = observed.get(id) || { statuses: new Set(), loaded: false };
    e.statuses.add(status);
    if (ok) e.loaded = true;
    observed.set(id, e);
  };

  page.on('response', (resp) => {
    const url = resp.url();
    if (!isRemoteEntry(url)) return;
    const status = resp.status();
    const id = pluginIdFromUrl(url);
    if (status >= 400) {
      remoteEntryFailures.push(`HTTP ${status} ${url}`);
      noteRemote(id, status, false);
    } else {
      noteRemote(id, status, true);
    }
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!isRemoteEntry(url)) return;
    const why = (req.failure() && req.failure().errorText) || 'unknown';
    remoteEntryFailures.push(`FAILED ${req.method()} ${url} — ${why}`);
    noteRemote(pluginIdFromUrl(url), 'failed', false);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') allConsoleErrors.push(msg.text());
  });

  // ---- prime + dismiss welcome modal ----
  await page
    .goto(BASE + '/app/home', { waitUntil: 'domcontentloaded', timeout: 90000 })
    .catch(() => {});
  await page
    .waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 90000 })
    .catch(() => {});
  for (const sel of ['[data-test-subj="homeWelcomeDismissButton"]', 'text=Dismiss']) {
    try {
      const el = await page.$(sel);
      if (el) await el.click({ timeout: 1500 });
    } catch (_) {}
  }

  // ---- per-page render checks (ALL core pages) ----
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
    await page
      .waitForSelector('[data-test-subj="headerGlobalNav"]', { timeout: 30000 })
      .catch(() => {});
    await page.waitForTimeout(3500);

    const navPresent = (await page.$('[data-test-subj="headerGlobalNav"]')) !== null;
    const body = (
      await page
        .evaluate(
          () => (document.querySelector('#opensearch-dashboards-body') || document.body).innerText
        )
        .catch(() => '')
    )
      .replace(/\s+/g, ' ')
      .trim();
    const errHit = ERR_STRINGS.filter((s) => body.includes(s));
    await page.screenshot({ path: `${OUT}/${id}.png`, fullPage: false }).catch(() => {});

    // Render-validity signal: the app chrome booted (navPresent) with no page
    // errors / error banners and a non-trivial body. The body threshold matches
    // verify_baseline.js (>40), which navigates this SAME page set on :5601 —
    // sparse empty-state app pages (e.g. visualize with no saved objects renders
    // only "Create your first visualization") legitimately have short bodies, so
    // the render verifier's >200 (tuned for 4 content-rich pages) is too strict
    // for full coverage. navPresent + 0 pageErrors + no ERR_STRINGS is the real
    // proof the MFE booted.
    const ok =
      navOk &&
      httpStatus < 400 &&
      pageErrors.length === 0 &&
      errHit.length === 0 &&
      navPresent &&
      body.length > 40;
    results.push({ id, route: p, ok, httpStatus, pageErrors, errHit, len: body.length, navPresent });
    page.off('pageerror', onErr);
  }

  // ---- probe any remotes NOT exercised by the page tour (read-only GET) ----
  // Module Federation loads remotes lazily, so the 12-page tour won't touch all
  // 58. Confirm the rest are reachable by GETting their registry remoteEntry URL
  // via the SAME browser context (so CDN/CORS/SRI behave as in the app).
  const probed = new Map(); // id -> { status, ok }
  const toProbe = remotes.filter((r) => !(observed.get(r.name) && observed.get(r.name).loaded));
  for (const r of toProbe) {
    if (!r.remoteEntry) {
      probed.set(r.name, { status: 'no-url', ok: false });
      continue;
    }
    try {
      const resp = await ctx.request.get(r.remoteEntry, { timeout: 30000 });
      const status = resp.status();
      const ok = status < 400;
      probed.set(r.name, { status, ok });
      if (!ok) remoteEntryFailures.push(`PROBE HTTP ${status} ${r.remoteEntry}`);
    } catch (e) {
      probed.set(r.name, { status: 'failed', ok: false });
      remoteEntryFailures.push(`PROBE FAILED ${r.remoteEntry} — ${e && e.message}`);
    }
  }

  await browser.close();

  // ---- report: page coverage table ----
  const failedPages = results.filter((r) => !r.ok);
  // eslint-disable-next-line no-console
  console.log('=== PAGE COVERAGE (' + (results.length - failedPages.length) + '/' + results.length + ') ===');
  // eslint-disable-next-line no-console
  console.log('  RESULT  PAGE                              HTTP  PERR  NAV  BODY');
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(
      `  ${(r.ok ? 'PASS' : 'FAIL').padEnd(6)}  ${r.id.padEnd(34)}  ${String(r.httpStatus).padEnd(4)}  ${String(
        r.pageErrors.length
      ).padEnd(4)}  ${(r.navPresent ? 'y' : 'n').padEnd(3)}  ${r.len}` +
        (r.errHit.length ? ' ERR=' + JSON.stringify(r.errHit) : '')
    );
    r.pageErrors.forEach((e) => console.log('          PAGEERROR ' + e));
  }

  // ---- report: remote coverage table ----
  let loadedCount = 0;
  let probedOkCount = 0;
  const remoteRows = remotes.map((r) => {
    const obs = observed.get(r.name);
    if (obs && obs.loaded) {
      loadedCount++;
      return { name: r.name, how: 'loaded', detail: 'http ' + Array.from(obs.statuses).join('/'), ok: true };
    }
    const pr = probed.get(r.name);
    if (pr && pr.ok) {
      probedOkCount++;
      return { name: r.name, how: 'probed', detail: 'http ' + pr.status, ok: true };
    }
    const detail = pr ? 'probe ' + pr.status : 'not loaded';
    return { name: r.name, how: 'MISSING', detail, ok: false };
  });
  const failedRemotes = remoteRows.filter((r) => !r.ok);

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(
    '=== REMOTE COVERAGE (' +
      (remoteRows.length - failedRemotes.length) +
      '/' +
      remoteRows.length +
      ' reachable; ' +
      loadedCount +
      ' loaded during nav, ' +
      probedOkCount +
      ' probed reachable) ==='
  );
  for (const r of remoteRows) {
    // eslint-disable-next-line no-console
    console.log(
      `  ${(r.ok ? 'OK' : 'FAIL').padEnd(4)}  ${r.name.padEnd(28)}  ${r.how.padEnd(8)}  ${r.detail}`
    );
  }

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log('network: failed remoteEntry (4xx/5xx/failed/probe) : ' + remoteEntryFailures.length);
  remoteEntryFailures.slice(0, 30).forEach((e) => console.log('   ' + e));
  if (allConsoleErrors.length) {
    // eslint-disable-next-line no-console
    console.log('console errors (informational)                     : ' + allConsoleErrors.length);
    allConsoleErrors.slice(0, 10).forEach((e) => console.log('   CONSOLE.ERROR ' + e));
  }

  // ---- assertions (story completion criteria) ----
  const assertions = [];
  assertions.push([
    'all ' + results.length + ' core pages render with 0 page errors',
    failedPages.length === 0,
  ]);
  assertions.push([
    'all ' + remoteRows.length + ' plugin remotes reachable/loaded (no failed remoteEntry)',
    failedRemotes.length === 0,
  ]);
  assertions.push(['0 failed remoteEntry requests (no 403/404/failed)', remoteEntryFailures.length === 0]);
  assertions.push([
    'registry remote count == expected ' + EXPECTED_REMOTES,
    remoteRows.length === EXPECTED_REMOTES,
  ]);

  // eslint-disable-next-line no-console
  console.log('');
  let pass = true;
  for (const [label, ok] of assertions) {
    // eslint-disable-next-line no-console
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
    if (!ok) pass = false;
  }
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(`screenshots: ${OUT}`);
  // eslint-disable-next-line no-console
  console.log(
    `MFE_COVERAGE ${pass ? 'OK' : 'FAILED'} (${results.length - failedPages.length}/${results.length} pages, ` +
      `${remoteRows.length - failedRemotes.length}/${remoteRows.length} remotes reachable)`
  );
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('FATAL', e);
  process.exit(2);
});
