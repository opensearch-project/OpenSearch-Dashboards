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
 * Module Federation share-scope seeding from `window.__osdSharedDeps__`.
 *
 * The MFE remotes declare these packages as MF `shared` singletons with
 * `import: false` (consume-only — they bundle NO fallback copy). Therefore the
 * host page MUST provide each one in the share scope BEFORE any remote loads,
 * or the remote fails at runtime. The shared instances come from the
 * `@osd/ui-shared-deps` bundle, which assigns them onto `window.__osdSharedDeps__`
 * under capitalised global keys. See `packages/osd-mfe/README.md` and
 * `packages/osd-ui-shared-deps/index.js` (the externals map).
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
 * Best-effort version label for a shared module. The build-time
 * `__versions__` map exported by `@osd/ui-shared-deps`'s entry.js is the
 * primary source — it carries the real package.json versions, which is what
 * the MF runtime needs to satisfy remote `requiredVersion` ranges (Issue 1
 * from the post-Phase-16 review). For each `SHARED_SINGLETONS` global key,
 * the host first looks at `sharedDeps.__versions__[globalKey]`. When that is
 * absent (a sharedDeps build older than the `__versions__` change, or a
 * mock used in tests), the function falls back to `.version` / `.VERSION` on
 * the module itself — which works for react/react-dom/moment but not the
 * many libraries that don't export a version property — and ultimately to
 * `'0.0.0'`.
 *
 * The exact value matters: even though remotes mark these `singleton: true`
 * (so the host instance is always used regardless), a non-satisfying
 * `requiredVersion` triggers a console warning per remote per page load.
 * The build-time map eliminates that warning class for the canonical case.
 */
export function readVersion(
  mod: unknown,
  versionsMap?: Record<string, unknown>,
  globalKey?: string
): string {
  if (versionsMap && globalKey) {
    const fromMap = versionsMap[globalKey];
    if (typeof fromMap === 'string' && fromMap.length > 0) {
      return fromMap;
    }
  }
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
  // The build-time-emitted version map (entry.js) lives on the same global.
  // When absent (older shared-deps build, or a test mock), readVersion falls
  // back to the legacy .version / .VERSION inspection — backward-compatible.
  const versionsMap =
    typeof sharedDeps.__versions__ === 'object' && sharedDeps.__versions__ !== null
      ? (sharedDeps.__versions__ as Record<string, unknown>)
      : undefined;

  for (const [pkg, globalKey] of Object.entries(SHARED_SINGLETONS)) {
    const mod = sharedDeps[globalKey];
    if (mod === undefined) {
      // Not provided by this shared-deps build; nothing to seed for this pkg.
      continue;
    }

    scope[pkg] = {
      [readVersion(mod, versionsMap, globalKey)]: {
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
