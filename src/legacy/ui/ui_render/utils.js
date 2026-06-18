/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Applies CSP modifications to base rules and returns the modified CSP header string.
 *
 * @param {string[]} baseRules - Array of CSP rule strings (e.g., ["script-src 'self'", "style-src 'self'"])
 * @param {Array<{directive: string, action: 'add' | 'remove' | 'set', values: string[]}>} modifications - Array of modification rules
 * @returns {string} Modified CSP header string
 */
export function applyCspModifications(baseRules, modifications) {
  const directiveMap = new Map();

  for (const rule of baseRules) {
    const trimmed = rule.trim().toLowerCase();
    if (!trimmed) continue;

    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) {
      // Directive with no values (e.g., "upgrade-insecure-requests")
      directiveMap.set(trimmed, new Set());
    } else {
      const [directive, ...values] = trimmed.split(' ').filter((v) => !!v.length);
      directiveMap.set(directive, new Set(values));
    }
  }

  for (const mod of modifications) {
    const directive = mod.directive.toLowerCase();
    const action = mod.action;
    const values = mod.values.map((v) => v.toLowerCase());

    switch (action) {
      case 'add':
        if (!directiveMap.has(directive)) {
          directiveMap.set(directive, new Set());
        }
        if (values.length > 0) {
          values.forEach((v) => directiveMap.get(directive).add(v));
        }
        break;

      case 'remove':
        if (directiveMap.has(directive)) {
          values.forEach((v) => directiveMap.get(directive).delete(v));
        }
        break;

      case 'set':
        directiveMap.set(directive, new Set(values));
        break;
    }
  }

  const parts = [];
  for (const [directive, values] of directiveMap.entries()) {
    if (values.size === 0) {
      parts.push(directive);
    } else {
      parts.push(`${directive} ${Array.from(values).join(' ')}`);
    }
  }
  return parts.join('; ');
}

const MFE_WIDENED_DIRECTIVES = new Set([
  // The bootstrap, shared-deps, plugin remoteEntry.js and their lazy chunks all
  // load as cross-origin <script>s — they MUST be allow-listed in script-src.
  'script-src',
  // Module-Federation lazy chunks injected after a remote mounts also load as
  // cross-origin <script>s. The `<script>` element-only directive narrows the
  // surface; widened only when the deployment opts into it (i.e. it exists in
  // baseRules — see "no tightening" rule below).
  'script-src-elem',
  // Monaco editor (used by the Console / Dev Tools / Discover apps) loads its
  // language servers as Web Workers. With OSD's default `worker-src blob: 'self'`
  // a worker fetched from the CDN would be blocked; widening lets remotes ship
  // their own worker code.
  'worker-src',
  // Phase 12 Story 5: extend the allow-list to the directives real remotes use
  // beyond just <script> and Worker. EUI / Monaco / theme styling, web fonts,
  // and runtime fetch()/XHR/WebSocket calls a remote may issue back to its
  // origin. We only widen these when they ALREADY exist in the base rules — we
  // never introduce a new directive, because that would TIGHTEN a policy that
  // was previously open (an unspecified directive with no `default-src` allows
  // any origin), and the threat model forbids tightening OSD's default CSP.
  // - style-src: cross-origin <link rel=stylesheet> + <style> elements bundled
  //   by remotes (CSS-in-JS still goes through 'unsafe-inline').
  // - style-src-elem: companion to style-src for <style>/<link> elements only.
  // - font-src: @font-face URLs hosted on the CDN.
  // - connect-src: fetch / XHR / WebSocket / EventSource a remote opens back to
  //   its CDN origin (e.g. data fetches, source-map probes in dev). Most OSD
  //   API calls are same-origin and unaffected.
  'style-src',
  'style-src-elem',
  'font-src',
  'connect-src',
]);

// Only http(s) origins are ever injected into the CSP. This rejects opaque /
// non-network schemes (e.g. `javascript:`, `data:`, `file:`) so they can never
// be allow-listed as a script source.
const MFE_ALLOWED_ORIGIN_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates and normalizes a configured MFE origin to a CSP-safe `scheme://host[:port]`
 * string. Returns the parsed `origin` ONLY when `url` is a parseable absolute URL with
 * an http(s) scheme; returns `undefined` for non-string / empty / unparseable input,
 * a bare hostname (e.g. `cdn.example.com` — no scheme), a wildcard (`'*'`), or any
 * non-http(s) scheme.
 *
 * This is the guard that prevents verbatim injection of an attacker- or
 * misconfiguration-controlled value (e.g. `'*'`) into `script-src`/`worker-src`:
 * anything that is not a concrete http(s) origin is dropped rather than appended.
 *
 * @param {*} url
 * @returns {string | undefined} the normalized http(s) origin, or `undefined` when invalid.
 */
function mfeOriginOf(url) {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (!MFE_ALLOWED_ORIGIN_PROTOCOLS.has(parsed.protocol)) return undefined;
    return parsed.origin;
  } catch (e) {
    return undefined;
  }
}

/**
 * Widens the CSP MFE-relevant directives with the cross-origin MFE script /
 * style / font / connect origins (Phase 5 — docs/01-MFE-DESIGN.md §6/§7;
 * extended in Phase 12 Story 5).
 *
 * In MFE mode (`opensearchDashboards.mfe.enabled`) the bootstrap bundle, the
 * shared-deps bundle, every plugin `remoteEntry.js` / chunk, the lazy-loaded
 * stylesheets/fonts they ship, and any fetch/XHR a remote opens back to its
 * own origin all come from origins other than `'self'`. OSD's default CSP
 * (`script-src 'unsafe-eval' 'self'`, `style-src 'unsafe-inline' 'self'`,
 * `worker-src blob: 'self'`) would block them, so the server allow-lists
 * exactly the MFE origins it is configured to load from. This is the
 * SHIPPED-config replacement for the old harness temp-yaml `csp.rules` hack.
 *
 * Origins added (ordered, de-duplicated) to every directive in
 * `MFE_WIDENED_DIRECTIVES` (script-src, script-src-elem, worker-src,
 * style-src, style-src-elem, font-src, connect-src) THAT ALREADY EXISTS in
 * `baseRules`:
 *   - the origin of `bootstrapUrl` and `sharedDepsUrl` (always — they are `<script>` loads);
 *   - `cdnOrigin` (the CDN serving plugin remotes/chunks/fonts/styles), when set;
 *   - `devOverrideOrigins`, ONLY when `allowOverride` is true (non-prod), so a
 *     developer can repoint an MFE at a local dev server — NEVER added in production.
 *
 * NO TIGHTENING. We never INTRODUCE a directive. If `baseRules` does not
 * contain `font-src` (the OSD default) the function leaves it unspecified —
 * which CSP treats as unrestricted (no `default-src` is set either) — rather
 * than emitting `font-src <cdnOrigin>` which would suddenly forbid every other
 * origin including `'self'`. The threat model is to EXTEND the OSD-default
 * permissive policy, not replace it; widening an existing directive is
 * additive (it's still permissive of `'self'` etc.), creating one would not be.
 *
 * The no-flag (MFE disabled) path never calls this, so its CSP is byte-for-byte
 * unchanged. Every configured origin is VALIDATED (via `mfeOriginOf`) to a
 * concrete http(s) `scheme://host[:port]` before it is added; a wildcard
 * (`'*'`), a bare hostname, or any non-http(s) value is rejected (never
 * injected verbatim). Only the directive name is lowercased for comparison.
 *
 * @param {string[]} baseRules - Base CSP rule strings (e.g. `http.csp.rules`).
 * @param {{ cdnOrigin?: string, bootstrapUrl?: string, sharedDepsUrl?: string, allowOverride?: boolean, devOverrideOrigins?: string[] }} [options]
 * @returns {string[]} A new rules array (or `baseRules` unchanged when no origins apply).
 */
export function buildMfeCspRules(baseRules, options = {}) {
  const { cdnOrigin, bootstrapUrl, sharedDepsUrl, allowOverride, devOverrideOrigins } = options;

  const origins = [];
  const addOrigin = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (trimmed && !origins.includes(trimmed)) origins.push(trimmed);
  };

  addOrigin(mfeOriginOf(bootstrapUrl));
  addOrigin(mfeOriginOf(sharedDepsUrl));
  // cdnOrigin is allow-listed ONLY when it validates to a concrete http(s) origin.
  // A wildcard ('*'), bare hostname, or any non-http(s) value is rejected (never
  // injected verbatim into script-src/worker-src).
  if (cdnOrigin) addOrigin(mfeOriginOf(cdnOrigin));
  if (allowOverride === true && Array.isArray(devOverrideOrigins)) {
    for (const o of devOverrideOrigins) {
      // Same validation as cdnOrigin: only concrete http(s) origins are added.
      addOrigin(mfeOriginOf(o));
    }
  }

  if (origins.length === 0) return baseRules;

  return baseRules.map((rule) => {
    if (typeof rule !== 'string') return rule;
    const trimmed = rule.trim();
    const firstSpace = trimmed.indexOf(' ');
    const directive = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();
    if (!MFE_WIDENED_DIRECTIVES.has(directive)) return rule;

    const existing = rule.split(/\s+/).filter((token) => !!token.length);
    const missing = origins.filter((origin) => !existing.includes(origin));
    if (missing.length === 0) return rule;
    return `${rule.replace(/\s+$/, '')} ${missing.join(' ')}`;
  });
}
