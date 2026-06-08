/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Module Federation share-scope seeding from `window.__osdSharedDeps__`
 * (Phase 3, Story 3).
 *
 * The MFE remotes declare these packages as MF `shared` singletons with
 * `import: false` (consume-only — they bundle NO fallback copy). Therefore the
 * host page MUST provide each one in the share scope BEFORE any remote loads,
 * or the remote fails at runtime. The shared instances come from the
 * `@osd/ui-shared-deps` bundle, which assigns them onto `window.__osdSharedDeps__`
 * under capitalised global keys. See docs/01-MFE-DESIGN.md §6 and
 * packages/osd-ui-shared-deps/index.js (the externals map).
 */

import { ShareScope } from './types';

/**
 * MF `shared` singleton package name → `__osdSharedDeps__` global key.
 *
 * This mirrors the top-level (non-subpath) entries of the
 * `@osd/ui-shared-deps` externals map, which is exactly the set that
 * `getMfeSharedConfig` marks as `singleton: true, import: false`. Subpath
 * specifiers (e.g. `react-dom/server`, `rxjs/operators`) are NOT MF-shared;
 * remotes reach those through plain `__osdSharedDeps__.*` externals.
 */
export const SHARED_SINGLETONS: Readonly<Record<string, string>> = {
  '@elastic/charts': 'ElasticCharts',
  '@elastic/eui': 'ElasticEui',
  '@elastic/numeral': 'ElasticNumeral',
  '@osd/i18n': 'OsdI18n',
  '@osd/monaco': 'OsdMonaco',
  jquery: 'Jquery',
  lodash: 'Lodash',
  moment: 'Moment',
  'moment-timezone': 'MomentTimezone',
  numeral: 'ElasticNumeral',
  react: 'React',
  'react-dom': 'ReactDom',
  'react-router': 'ReactRouter',
  'react-router-dom': 'ReactRouterDom',
  rxjs: 'Rxjs',
  'styled-components': 'StyledComponents',
  tslib: 'TsLib',
};

/**
 * Best-effort version label for a shared module. Many libraries expose
 * `.version` (react, react-dom, moment) or `.VERSION` (lodash); the rest fall
 * back to `'0.0.0'`. The exact value is non-critical: because the remotes mark
 * these `singleton: true`, the MF runtime uses the single host-provided copy
 * regardless of the version key (a non-satisfying `requiredVersion` only logs a
 * console warning, it does not change which instance is used).
 */
export function readVersion(mod: unknown): string {
  const candidate = mod as { version?: unknown; VERSION?: unknown } | null | undefined;
  if (candidate) {
    if (typeof candidate.version === 'string' && candidate.version.length > 0) {
      return candidate.version;
    }
    if (typeof candidate.VERSION === 'string' && candidate.VERSION.length > 0) {
      return candidate.VERSION;
    }
  }
  return '0.0.0';
}

/**
 * Build a Module Federation share scope from the shared-deps global object.
 *
 * For every {@link SHARED_SINGLETONS} entry present on `sharedDeps`, register a
 * single host-provided record whose factory returns the live module instance.
 * Because the same instance is handed to every remote, react/react-dom (and the
 * other singletons) resolve to ONE shared copy — no duplicate React at runtime.
 * Packages whose global is absent are skipped (the remote either does not need
 * them or will surface its own clear error).
 *
 * @param sharedDeps the `window.__osdSharedDeps__` object
 * @returns a share scope ready to pass to every `container.init(...)`
 */
export function buildShareScope(sharedDeps: Record<string, unknown>): ShareScope {
  const scope: ShareScope = {};

  for (const [pkg, globalKey] of Object.entries(SHARED_SINGLETONS)) {
    const mod = sharedDeps[globalKey];
    if (mod === undefined) {
      // Not provided by this shared-deps build; nothing to seed for this pkg.
      continue;
    }

    scope[pkg] = {
      [readVersion(mod)]: {
        // `get` returns a factory; the factory returns the live module so all
        // remotes share this exact instance (true singleton identity).
        get: () => () => mod,
        from: 'host',
        eager: true,
        loaded: 1,
      },
    };
  }

  return scope;
}
