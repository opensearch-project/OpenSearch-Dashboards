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

const MFE_WIDENED_DIRECTIVES = new Set(['script-src', 'worker-src']);

/**
 * Returns `new URL(url).origin`, or `undefined` for non-string / empty / unparseable input.
 *
 * @param {*} url
 * @returns {string | undefined}
 */
function mfeOriginOf(url) {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).origin;
  } catch (e) {
    return undefined;
  }
}

/**
 * Widens the CSP `script-src`/`worker-src` directives with the cross-origin MFE
 * script origins (Phase 5 — docs/01-MFE-DESIGN.md §6/§7).
 *
 * In MFE mode (`opensearchDashboards.mfe.enabled`) the bootstrap bundle, the
 * shared-deps bundle, and every plugin `remoteEntry.js` / chunk load from origins
 * other than `'self'`. OSD's default `script-src 'unsafe-eval' 'self'` would block
 * them, so the server allow-lists exactly the MFE origins it is configured to load
 * from. This is the SHIPPED-config replacement for the old harness temp-yaml
 * `csp.rules` hack.
 *
 * Origins added (ordered, de-duplicated) to BOTH `script-src` and `worker-src`:
 *   - the origin of `bootstrapUrl` and `sharedDepsUrl` (always — they are `<script>` loads);
 *   - `cdnOrigin` (the CDN serving plugin remotes/chunks), when set;
 *   - `devOverrideOrigins`, ONLY when `allowOverride` is true (non-prod), so a
 *     developer can repoint an MFE at a local dev server — NEVER added in production.
 *
 * The no-flag (MFE disabled) path never calls this, so its CSP is byte-for-byte
 * unchanged. Only `script-src`/`worker-src` are widened; all other directives
 * (e.g. `style-src`) are returned untouched. Origins are appended verbatim (only
 * the directive name is lowercased for comparison).
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
  if (cdnOrigin) addOrigin(mfeOriginOf(cdnOrigin) || cdnOrigin);
  if (allowOverride === true && Array.isArray(devOverrideOrigins)) {
    for (const o of devOverrideOrigins) {
      addOrigin(mfeOriginOf(o) || (typeof o === 'string' ? o : undefined));
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
