/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * NO-FLAG HTML INVARIANT GATE.
 *
 * HARD INVARIANT: WITHOUT `--mfe`, the served HTML + behaviour are
 * byte-for-byte unchanged. This gate captures the CURRENT old-way :5601
 * /app/home shell and compares it to the pre-MFE-render reference captured
 * before any render-touching change (dev/baseline_html/app_home.pre_p3.html).
 *
 * Two volatile, change-INDEPENDENT sources of noise are normalised:
 *   1. the per-request CSP `nonce="..."` (regenerated every render); and
 *   2. the non-deterministic ITERATION ORDER of the injectedMetadata
 *      `uiPlugins` array and `uiSettings.defaults` keys across server restarts
 *      (present independently of this change; proven by identical payload size).
 *
 * The proof has two parts, BOTH must hold for the diff to be "empty":
 *   A. SHELL (everything OUTSIDE <osd-injected-metadata>, nonce-normalised) is
 *      BYTE-IDENTICAL to the reference.
 *   B. injectedMetadata is semantically identical after canonicalisation
 *      (recursive key sort + order-insensitive arrays), AND carries NO `mfe`
 *      key (the Story-4 render branch is completely inert when the flag is off).
 *
 * Usage:  source harness/env.sh && node harness/verify_noflag_diff.js
 * Env:    OSD_URL  (old-way OSD, default http://localhost:5601)
 *         BASELINE_HTML (default harness/baseline_html/app_home.pre_p3.html)
 * Exit:   0 = no-flag diff empty; 1 = a difference detected; 2 = fatal.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const OSD_URL = (process.env.OSD_URL || 'http://localhost:5601').replace(/\/+$/, '');
const BASELINE_HTML =
  process.env.BASELINE_HTML ||
  path.join(__dirname, 'baseline_html/app_home.pre_p3.html');

let failures = 0;
function check(cond, msg) {
  // eslint-disable-next-line no-console
  console.log((cond ? '  PASS ' : '  FAIL ') + msg);
  if (!cond) failures += 1;
  return cond;
}

/** GET a URL following one redirect; resolve the raw HTML body. */
function getHtml(url, redirectsLeft = 3) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          res.resume();
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : OSD_URL + res.headers.location;
          resolve(getHtml(next, redirectsLeft - 1));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => resolve({ status: res.statusCode, html: data }));
      })
      .on('error', reject);
  });
}

// Normalise the per-request CSP nonce so it never registers as a diff. The same
// nonce value appears in several forms (the `nonce="..."` script attribute, the
// `<meta name="csp-nonce" content="...">` tag, and inline patch scripts), so we
// extract the document's own nonce value and replace EVERY occurrence of it.
function stripNonce(html) {
  let out = html.replace(/nonce="[^"]*"/g, 'nonce="__NONCE__"');
  const m = html.match(/nonce="([^"]+)"/) || html.match(/csp-nonce" content="([^"]+)"/);
  if (m && m[1]) {
    // split/join avoids regex-escaping the base64 nonce value (+ / = chars).
    out = out.split(m[1]).join('__NONCE__');
  }
  return out;
}

// Extract the html-entity-encoded injectedMetadata `data="..."` attribute.
// Internal JSON quotes are encoded as &quot;, so the first real `"` terminates
// the attribute and [^"]* is a safe capture.
const META_RE = /(<osd-injected-metadata data=")([^"]*)(")/;

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&'); // must be last
}

// Canonicalise JSON so non-deterministic ordering (object keys + arrays) does
// not register as a difference: recursively sort object keys, and sort arrays
// by the canonical string of their elements.
function canonical(value) {
  if (Array.isArray(value)) {
    const items = value.map(canonical);
    items.sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
    return items;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = canonical(value[k]);
    return out;
  }
  return value;
}

async function main() {
  if (!fs.existsSync(BASELINE_HTML)) {
    // eslint-disable-next-line no-console
    console.error('FATAL: baseline reference not found at ' + BASELINE_HTML);
    process.exit(2);
  }
  const baselineRaw = fs.readFileSync(BASELINE_HTML, 'utf8');

  const cur = await getHtml(OSD_URL + '/app/home');
  // eslint-disable-next-line no-console
  console.log('No-flag HTML invariant: OSD=' + OSD_URL + '  baseline=' + BASELINE_HTML);
  check(cur.status === 200, 'GET /app/home returns 200 (got ' + cur.status + ')');

  const curN = stripNonce(cur.html);
  const baseN = stripNonce(baselineRaw);

  const curMeta = curN.match(META_RE);
  const baseMeta = baseN.match(META_RE);
  if (!check(!!curMeta && !!baseMeta, 'both documents contain <osd-injected-metadata>')) {
    process.exit(failures === 0 ? 0 : 1);
  }

  // --- Part A: shell OUTSIDE injected-metadata must be byte-identical ---
  const PLACEHOLDER = '__INJECTED_METADATA__';
  const curShell = curN.replace(META_RE, '$1' + PLACEHOLDER + '$3');
  const baseShell = baseN.replace(META_RE, '$1' + PLACEHOLDER + '$3');
  const shellIdentical = curShell === baseShell;
  check(shellIdentical, 'HTML shell (outside injected-metadata, nonce-normalised) is BYTE-IDENTICAL');
  if (!shellIdentical) {
    // Show the first divergence to aid debugging.
    let i = 0;
    while (i < curShell.length && i < baseShell.length && curShell[i] === baseShell[i]) i++;
    // eslint-disable-next-line no-console
    console.log('   first shell divergence at offset ' + i + ':');
    // eslint-disable-next-line no-console
    console.log('     baseline: …' + JSON.stringify(baseShell.slice(i - 40, i + 40)));
    // eslint-disable-next-line no-console
    console.log('     current : …' + JSON.stringify(curShell.slice(i - 40, i + 40)));
  }

  // --- Part B: injectedMetadata semantic equality + no `mfe` key ---
  let curMetaObj;
  let baseMetaObj;
  try {
    curMetaObj = JSON.parse(decodeEntities(curMeta[2]));
    baseMetaObj = JSON.parse(decodeEntities(baseMeta[2]));
  } catch (e) {
    check(false, 'injectedMetadata parses as JSON (' + e.message + ')');
    process.exit(1);
  }

  check(
    !Object.prototype.hasOwnProperty.call(curMetaObj, 'mfe'),
    'current injectedMetadata has NO `mfe` key (render branch inert when flag off)'
  );
  check(
    Object.keys(curMetaObj).sort().join(',') === Object.keys(baseMetaObj).sort().join(','),
    'injectedMetadata top-level keys identical to baseline'
  );

  const curCanon = JSON.stringify(canonical(curMetaObj));
  const baseCanon = JSON.stringify(canonical(baseMetaObj));
  const metaEqual = curCanon === baseCanon;
  check(
    metaEqual,
    'injectedMetadata semantically identical (canonicalised: key-sorted + order-insensitive)'
  );
  if (!metaEqual) {
    let i = 0;
    while (i < curCanon.length && i < baseCanon.length && curCanon[i] === baseCanon[i]) i++;
    // eslint-disable-next-line no-console
    console.log('   first metadata divergence at offset ' + i + ':');
    // eslint-disable-next-line no-console
    console.log('     baseline: …' + JSON.stringify(baseCanon.slice(i - 60, i + 60)));
    // eslint-disable-next-line no-console
    console.log('     current : …' + JSON.stringify(curCanon.slice(i - 60, i + 60)));
  }

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log(
    'NO_FLAG_DIFF ' +
      (failures === 0 ? 'EMPTY' : 'NON-EMPTY') +
      ' (' +
      (failures === 0
        ? 'WITHOUT --mfe served HTML is unchanged vs the no-flag baseline'
        : failures + ' difference(s) detected')
      + ')'
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('FATAL', err);
  process.exit(2);
});
