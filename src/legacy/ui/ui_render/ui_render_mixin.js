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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { createHash, randomBytes } from 'crypto';
import Boom from '@hapi/boom';
import { i18n, i18nLoader } from '@osd/i18n';
import * as v7light from '@elastic/eui/dist/eui_theme_light.json';
import * as v7dark from '@elastic/eui/dist/eui_theme_dark.json';
import * as v8light from '@elastic/eui/dist/eui_theme_next_light.json';
import * as v8dark from '@elastic/eui/dist/eui_theme_next_dark.json';
import * as v9light from '@elastic/eui/dist/eui_theme_v9_light.json';
import * as v9dark from '@elastic/eui/dist/eui_theme_v9_dark.json';
import * as UiSharedDeps from '@osd/ui-shared-deps';
import { OpenSearchDashboardsRequest } from '../../../core/server';
import { fromRoot } from '../../../core/server/utils';
import { resolveAllowOverride } from '../../../core/server/utils/resolve_allow_override';
import { resolveCompatPolicy } from '../../../core/server/utils/resolve_compat_policy';
import { resolveMfeHostEnv } from '../../../core/server/utils/resolve_mfe_host_env';
import {
  bucketFromCookie,
  buildBucketSetCookie,
  generateBucketCookieValue,
  parseSingleCookie,
  readMfeBootManifest,
} from '../../../core/server/utils/mfe_boot_manifest';
import { AppBootstrap } from './bootstrap';
import { getApmConfig } from '../apm';
import { applyCspModifications, buildMfeCspRules } from './utils';

/**
 * @typedef {import('../../server/osd_server').default} OsdServer
 * @typedef {import('../../server/osd_server').ResponseToolkit} ResponseToolkit
 */

/**
 *
 * @param {OsdServer} osdServer
 * @param {OsdServer['server']} server
 * @param {OsdServer['config']} config
 */
export function uiRenderMixin(osdServer, server, config) {
  const translationsCache = { translations: null, hash: null };
  // `i18n.getLocale` will always return a value; the 'en' is just to accommodate tests
  const defaultLocale = i18n.getLocale() || 'en';

  // Route handler for serving translation files.
  // This handler supports two scenarios:
  // 1. Serving translations for the default locale
  // 2. Serving translations for other registered locales
  server.route({
    path: '/translations/{locale}.json',
    method: 'GET',
    config: { auth: false },
    handler: async (request, h) => {
      const { locale } = request.params;
      const normalizedLocale = i18n.normalizeLocale(locale);
      let warning = null;

      // Function to get or create cached translations
      const getCachedTranslations = async (localeKey, getTranslationsFn) => {
        if (!translationsCache[localeKey]) {
          const translations = await getTranslationsFn();
          translationsCache[localeKey] = {
            translations: translations,
            hash: createHash('sha1').update(JSON.stringify(translations)).digest('hex'),
          };
        }
        return translationsCache[localeKey];
      };

      let cachedTranslations;

      if (normalizedLocale === defaultLocale) {
        // Default locale
        cachedTranslations = await getCachedTranslations(defaultLocale, () =>
          i18n.getTranslation()
        );
      } else if (i18nLoader.isRegisteredLocale(normalizedLocale)) {
        // Other registered locales
        cachedTranslations = await getCachedTranslations(normalizedLocale, () =>
          i18nLoader.getTranslationsByLocale(locale)
        );
      } else {
        // Locale not found, fall back to en locale
        cachedTranslations = await getCachedTranslations('en', () =>
          i18nLoader.getTranslationsByLocale('en')
        );
        warning = {
          title: 'Unsupported Locale',
          text: `The requested locale "${locale}" is not supported. Falling back to English.`,
        };
      }

      const response = {
        translations: cachedTranslations.translations,
        warning,
      };

      return h
        .response(response)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/json')
        .etag(cachedTranslations.hash);
    },
  });

  const authEnabled = !!server.auth.settings.default;
  server.route({
    path: '/bootstrap.js',
    method: 'GET',
    config: {
      tags: ['api'],
      auth: authEnabled ? { mode: 'try' } : false,
    },
    async handler(request, h) {
      const buildHash = server.newPlatform.env.packageInfo.buildNum;
      const basePath = config.get('server.basePath');

      const regularBundlePath = `${basePath}/${buildHash}/bundles`;
      // Phase 3 MFE mode (docs/01-MFE-DESIGN.md §6). When enabled, serve a bootstrap
      // that OMITS the local plugin bundles and instead loads core.entry.js plus the
      // MFE bootstrap (which seeds the MF share scope from the origin shared-deps,
      // fetches the registry at serve time, loads each plugin remote, and registers it
      // into the __osdBundles__ shim before invoking core boot). Without the flag this
      // branch is skipped entirely, so the default bootstrap below is byte-for-byte
      // unchanged.
      const mfeEnabled = !!config.get('opensearchDashboards.mfe.enabled');
      if (mfeEnabled) {
        // Phase 13 Story 3: registry contract + reference reader. When a
        // registry file path is configured, the OSD server reads it (auto-
        // migrating a v1 doc on the fly), resolves it server-side against the
        // requesting host's dimensions (`customerId` from server config,
        // `userBucket` from a sticky HttpOnly cookie), and INJECTS the resulting
        // flat boot manifest into the bootstrap. The browser then consumes the
        // manifest directly — ZERO `/registry` HTTP fetches in --mfe mode
        // (verify_phase13 case G). When `registryPath` is empty (legacy /
        // pre-Phase-13 deployments), this block is skipped and the bootstrap
        // falls back to `mfeRegistryUrl` as before.
        const mfeRegistryPath = config.get('opensearchDashboards.mfe.registryPath');
        const mfeCustomerId = config.get('opensearchDashboards.mfe.customerId') || 'default';
        const mfeBucketCookieName =
          config.get('opensearchDashboards.mfe.userBucketCookieName') || '_osd_mfe_bucket';

        // Cookie roundtrip: read existing bucket cookie or mint a fresh one.
        // On a missing cookie, set it on this response so the assignment is
        // sticky thereafter; same client => same bucket on every subsequent
        // request, which is what makes the canary assignment deterministic.
        let mfeBucketCookieValue = parseSingleCookie(
          request.headers && request.headers.cookie,
          mfeBucketCookieName
        );
        let mfeBucketCookieToSet = null;
        if (!mfeBucketCookieValue) {
          mfeBucketCookieValue = generateBucketCookieValue();
          mfeBucketCookieToSet = buildBucketSetCookie(mfeBucketCookieName, mfeBucketCookieValue);
        }
        const mfeUserBucket = bucketFromCookie(mfeBucketCookieValue);

        // Read + resolve the v2 (or v1, auto-migrated; v3 since Phase 16
        // Story 3) registry into a flat boot manifest. Only when a path is
        // configured — otherwise bake an empty `null` into the template and
        // the browser falls back to the legacy fetch path.
        let mfeBootManifestJson = 'null';
        // Phase 16 Story 3: when the source registry is v3 AND has an
        // `orchestrator` top-level field, the boot manifest carries an
        // `orchestrator: { url, integrity? }` descriptor (the bootstrap
        // template renders this into __osdMfe__.orchestrator so the thin
        // shim loads the orchestrator from the registry-advertised URL with
        // SRI). When absent (v1/v2, or v3 without the field), the descriptor
        // is `null` and the thin shim falls back to the server-config
        // `mfeBootstrapUrl` — backward-compat at the consumption site.
        let mfeOrchestratorJson = 'null';
        // Phase 16 Story 5: same shape, same posture for the OSD `core`
        // entry script. When the source registry is v3 AND has a `core`
        // top-level field, the boot manifest carries a `core: { url,
        // integrity? }` descriptor — and the MFE orchestrator
        // (`bootstrapMfe()` in `packages/osd-mfe/src/bootstrap/bootstrap_mfe.ts`)
        // loads `core.entry.js` from THAT URL with SRI BEFORE invoking core
        // boot (a tampered core fails closed: `loadScript` rejects, the
        // orchestrator never calls `invokeCoreBootstrap`, the failure surface
        // fires). When absent (v1/v2 registries, or v3 without the field),
        // the descriptor is `null` and the thin shim's jsDependencyPaths
        // keeps the legacy `${regularBundlePath}/core/core.entry.js` entry
        // so core loads from THIS server as today — backward-compat at the
        // consumption site, byte-for-byte unchanged for v1/v2 deployments.
        let mfeCoreJson = 'null';
        // Capture the resolved v3 `core` descriptor for the
        // jsDependencyPaths branch below — when set, the thin shim OMITS
        // the legacy server-bundled core entry path because the orchestrator
        // will load core from the CDN URL itself. The lazy `core.chunk.*.js`
        // chunks stay on this server (`__osdPublicPath__.core` keeps the
        // `${regularBundlePath}/core/` value below); only the entry script
        // moves to CDN. This narrow scope matches Story 5 (and minimises
        // blast radius — bundling all of core's static output is a future
        // phase).
        let resolvedCore = null;
        // Phase 16 Story 6: same shape, same posture for per-theme CSS
        // bundles (`light` / `dark` / …). When the source registry is v3
        // AND advertises a `themes` map, the boot manifest carries a
        // `themes: Record<string, { url, integrity? }>` descriptor — and:
        //   - the HTML head's `<meta name="osd-mfe-themes">` (rendered by
        //     `rendering_service.tsx`) carries the resolved URLs so
        //     `startup.js` can pick the active theme (light/dark from
        //     localStorage) and `appendChild(<link rel=stylesheet>)` with
        //     SRI BEFORE `bootstrap.js` runs — no FOUC;
        //   - the legacy `/ui/legacy_<name>_theme.css` route on this server
        //     is REFUSED with 404 for any theme name the registry knows
        //     (so a misconfigured browser can never silently fall back to a
        //     same-origin copy that the SRI gate wouldn't catch);
        //   - the bootstrap_mfe thin shim's `styleSheetPaths` OMITS the
        //     legacy theme CSS entry because startup.js already loaded it.
        // When absent (v1/v2 registries, or v3 without the field), the
        // descriptor is `null`, the META isn't emitted, the legacy
        // `/ui/...` route serves as today, and the thin shim's
        // styleSheetPaths keeps the legacy theme CSS entry — byte-for-byte
        // unchanged backward-compat. The JSON form goes into the bootstrap
        // template (`__osdMfe__.themes` for the styleSheetPaths gate); the
        // resolved-object form is currently unused inline here (rendering
        // service handles the META injection), but kept for symmetry with
        // Story 5's `resolvedCore` so a future refactor can lift both into
        // a single resolved-manifest map.
        let mfeThemesJson = 'null';
        // Phase 16 Story 7: same shape, same posture for the BASE
        // `osd-ui-shared-deps.css` bundle (singular — one URL per
        // registry; the per-theme variant CSS files in the same dist
        // directory are out of scope, see schema_v3.ts). When the source
        // registry is v3 AND advertises a `sharedDepsCss` top-level
        // field, the boot manifest carries a `{ url, integrity? }`
        // descriptor — and the bootstrap_mfe thin shim's
        // `styleSheetPaths` uses THAT URL (object form, SRI pinned,
        // cross-origin) instead of the legacy
        // `${regularBundlePath}/osd-ui-shared-deps/osd-ui-shared-deps.css`
        // same-origin path. The legacy bundle route also 404s the
        // file via `optimize_mixin.ts`'s `mfeSharedDepsCssRefuser` to
        // prevent silent fall-back. When absent (v1/v2 registries, or
        // v3 without the field), the descriptor is `null` and the
        // thin shim keeps the legacy same-origin path — byte-for-
        // byte unchanged backward-compat.
        let mfeSharedDepsCssJson = 'null';
        if (mfeRegistryPath && typeof mfeRegistryPath === 'string') {
          try {
            const resolved = readMfeBootManifest(mfeRegistryPath, {
              customerId: String(mfeCustomerId),
              userBucket: mfeUserBucket,
            });
            mfeBootManifestJson = JSON.stringify(resolved);
            if (resolved.orchestrator) {
              mfeOrchestratorJson = JSON.stringify(resolved.orchestrator);
            }
            if (resolved.core) {
              mfeCoreJson = JSON.stringify(resolved.core);
              resolvedCore = resolved.core;
            }
            if (resolved.themes) {
              mfeThemesJson = JSON.stringify(resolved.themes);
            }
            if (resolved.sharedDepsCss) {
              mfeSharedDepsCssJson = JSON.stringify(resolved.sharedDepsCss);
            }
          } catch (err) {
            // Fail loudly server-side; the bootstrap falls back to the legacy
            // fetch path so a misconfigured registry path doesn't white-screen
            // the app — but the operator gets a clear log line.
            // eslint-disable-next-line no-console
            console.error(
              `[mfe] Failed to read/resolve registry at ${mfeRegistryPath}; falling back to ` +
                `the legacy registry-fetch path. Cause: ${(err && err.message) || err}`
            );
          }
        }

        const mfeRegistryUrl = config.get('opensearchDashboards.mfe.registryUrl');
        const mfeSharedDepsUrl = config.get('opensearchDashboards.mfe.sharedDepsUrl');
        const mfeBootstrapUrl = config.get('opensearchDashboards.mfe.bootstrapUrl');
        // Phase 14 Story 1: telemetry sink URL (mfe-gated server config; empty
        // default = OFF / silent no-op — see opensearch_dashboards_config.ts).
        // Stringify to keep the template safe even if the value contains a
        // single quote (would break the surrounding `'…'` literal). Empty =>
        // the browser dispatcher is a no-op; never POSTs, never logs.
        const mfeTelemetryEndpoint = JSON.stringify(
          config.get('opensearchDashboards.mfe.telemetryEndpoint') || ''
        );

        // Non-production security GATE for dev URL-overrides (Phase 5, §7). An
        // explicit `mfe.allowOverride` always wins; when unset it defaults to the
        // server's dev mode (dev => true, prod => false) so arbitrary remote code
        // can never load via an override in production. Uses the shared core
        // resolveAllowOverride() helper (mirrors the canonical one in @osd/mfe,
        // which is not a dependency of src/).
        const mfeAllowOverride = resolveAllowOverride(
          config.get('opensearchDashboards.mfe.allowOverride'),
          !!server.newPlatform.env.mode.dev
        );

        // Phase 9 version-compatibility contract. Resolve the EFFECTIVE env-keyed
        // compat POLICY (onIncompatible/onMissing default dev=block|warn-load vs
        // prod=skip; strictShared default true; explicit config always wins) and
        // the running HOST environment (OSD core version + the shared-singleton
        // ranges the host provides), and inject BOTH into the page so the browser
        // bootstrap can classify each remote against the host and enforce the
        // policy (skip incompatible/unknown in prod; hard-block in non-prod). The
        // host env is derived from the SAME sources the remotes recorded their
        // builtAgainst against, so the all-from-one-tree happy path stays fully
        // compatible. Both use the core-side mirrors of the @osd/mfe helpers
        // (which src/ cannot import), exactly as resolveAllowOverride is mirrored.
        const mfeCompatPolicy = JSON.stringify(
          resolveCompatPolicy(
            config.get('opensearchDashboards.mfe.compat'),
            !!server.newPlatform.env.mode.dev
          )
        );
        const mfeHostEnv = JSON.stringify(
          resolveMfeHostEnv(server.newPlatform.env.packageInfo.version, fromRoot('.'))
        );

        // Phase 12 Story 4: registry AUTHENTICITY. When a verification key is
        // configured, inject the host-held verification material so the browser
        // bootstrap REQUIRES the fetched registry to carry a valid signature and
        // fails closed otherwise. The key is delivered by THIS trusted OSD origin
        // (not the CDN that serves the registry), which is what defeats a
        // compromised-CDN/MITM serving altered registry bytes. When no key is
        // configured (the default), inject `null` so signing stays OFF (the registry
        // loads unverified, backward compatible). This whole block lives inside the
        // mfe-enabled branch, so the no-flag served HTML is byte-for-byte unchanged.
        const mfeRegistrySignature = config.get('opensearchDashboards.mfe.registrySignature');
        const mfeRegistryVerification =
          mfeRegistrySignature && mfeRegistrySignature.verificationKey
            ? JSON.stringify({
                algorithm: mfeRegistrySignature.algorithm,
                keyId: mfeRegistrySignature.keyId,
                key: mfeRegistrySignature.verificationKey,
              })
            : 'null';

        // The OSD shared-deps bundle is split: the entry (`mfeSharedDepsUrl`) only
        // assigns window.__osdSharedDeps__ once its dependency chunks
        // (UiSharedDeps.jsDepFilenames — e.g. the large `@elastic` vendor chunk)
        // are loaded first. Derive their origin URLs as siblings of the entry (same
        // directory) so the MFE bootstrap can load them in order before the entry,
        // mirroring the default bootstrap's jsDepFilenames-then-jsFilename order.
        const mfeSharedDepsDir = String(mfeSharedDepsUrl).replace(/[^/]*$/, '');
        const mfeSharedDepsDepUrls = JSON.stringify(
          UiSharedDeps.jsDepFilenames.map((filename) => `${mfeSharedDepsDir}${filename}`)
        );

        // Only core is loaded locally; plugin remotes are resolved from the registry at
        // runtime. shared-deps for the share scope are loaded by the MFE bootstrap.
        // Phase 16 Story 5: when the registry advertises a `core` descriptor,
        // the orchestrator loads `core.entry.js` from the CDN URL with SRI
        // BEFORE invoking core boot, so the thin shim MUST NOT preload the
        // legacy server-bundled core entry (otherwise the browser would
        // double-fetch and the SRI-pinned CDN bytes would be racing the
        // server bytes). On v1/v2 registries (and v3 without `core`) the
        // legacy path is preserved verbatim — same byte-for-byte boot as
        // pre-Story-5.
        const mfeJsDependencyPaths = resolvedCore
          ? []
          : [`${regularBundlePath}/core/core.entry.js`];

        // The publicPathMap is unchanged: when `core.entry.js` executes, it
        // sets `__webpack_public_path__ = window.__osdPublicPath__.core` so
        // its lazy chunks (`core.chunk.*.js`) load via that base. Story 5
        // moves ONLY the entry script to the CDN; the lazy chunks stay on
        // THIS server, so the public-path base keeps pointing at
        // `${regularBundlePath}/core/`. (Moving the chunks too is a future
        // phase — out of scope per Story 5 description.)
        const mfePublicPathMap = JSON.stringify({
          core: `${regularBundlePath}/core/`,
          'osd-ui-shared-deps': `${regularBundlePath}/osd-ui-shared-deps/`,
        });

        const mfeBootstrap = new AppBootstrap(
          {
            templateData: {
              jsDependencyPaths: mfeJsDependencyPaths,
              publicPathMap: mfePublicPathMap,
              basePath,
              regularBundlePath,
              UiSharedDeps,
              THEME_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.themeCssDistFilenames),
              KUI_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.kuiCssDistFilenames),
              mfeRegistryUrl,
              mfeSharedDepsUrl,
              mfeSharedDepsDepUrls,
              mfeBootstrapUrl,
              mfeAllowOverride,
              mfeCompatPolicy,
              mfeHostEnv,
              mfeRegistryVerification,
              // Phase 14 Story 1: telemetry sink + the two dimensions the
              // browser stamps on every emitted event. `mfeTelemetryEndpoint`
              // is JSON-stringified above (empty = OFF). `mfeCustomerId` is
              // the resolved tenant id; `mfeUserBucket` the cookie-derived
              // 0..99 canary bucket. Both flow into __osdMfe__ in the template
              // so the bootstrap can stamp them on every load event without
              // re-deriving server-side state.
              mfeTelemetryEndpoint,
              mfeCustomerId: JSON.stringify(String(mfeCustomerId)),
              mfeUserBucket,
              // Phase 13 Story 3: server-resolved boot manifest. When non-`null`
              // the bootstrap consumes this directly and skips the registry HTTP
              // fetch (and the registry signature verify) entirely.
              mfeBootManifest: mfeBootManifestJson,
              // Phase 16 Story 3: v3-only orchestrator descriptor. When
              // non-`null` the thin shim loads the orchestrator from
              // `__osdMfe__.orchestrator.url` (with `.integrity` for SRI);
              // otherwise it falls back to the server-config
              // `mfeBootstrapUrl` (backward-compat for v1/v2 registries
              // and v3 registries without the field set).
              mfeOrchestrator: mfeOrchestratorJson,
              // Phase 16 Story 5: v3-only core descriptor. When non-`null`,
              // the MFE orchestrator (bootstrap_mfe.ts) loads
              // `core.entry.js` from `__osdMfe__.core.url` (with
              // `.integrity` for SRI) BEFORE invoking core boot — a
              // tampered core fails closed (the orchestrator never calls
              // `invokeCoreBootstrap`, the failure surface fires). On
              // v1/v2 (or v3 without `core`) this stays `null` and the
              // thin shim preloads `${regularBundlePath}/core/core.entry.js`
              // from THIS server exactly as today.
              mfeCore: mfeCoreJson,
              // Phase 16 Story 6: v3-only per-theme CSS bundle descriptor.
              // When non-`null` (a map keyed by `light` / `dark` / …),
              // `startup.js` has ALREADY loaded the active theme from
              // `__osdMfe__.themes[themeMode].url` (with SRI) via the
              // `<meta name="osd-mfe-themes">` tag injected in the HTML
              // head, BEFORE `bootstrap.js` ran. The thin shim's
              // `styleSheetPaths` then OMITS the legacy
              // `/ui/legacy_<themeMode>_theme.css` entry to avoid a
              // double-fetch — the `__osdMfe__.themes` value is the
              // server's authoritative signal that the theme is already in
              // <head>. On v1/v2 (or v3 without `themes`) this stays
              // `null` and the thin shim keeps the legacy entry — byte-for-
              // byte unchanged backward-compat.
              mfeThemes: mfeThemesJson,
              // Phase 16 Story 7: v3-only base `osd-ui-shared-deps.css`
              // descriptor (singular — one URL per registry). When
              // non-`null`, the bootstrap_mfe thin shim's
              // `styleSheetPaths` uses `__osdMfe__.sharedDepsCss.url`
              // (object form, SRI pinned, `crossorigin="anonymous"`)
              // instead of the legacy
              // `${regularBundlePath}/osd-ui-shared-deps/osd-ui-shared-deps.css`
              // same-origin path, and the legacy bundle route 404s the
              // same file. On v1/v2 (or v3 without `sharedDepsCss`)
              // this stays `null` and the thin shim keeps the legacy
              // path — byte-for-byte unchanged backward-compat.
              mfeSharedDepsCss: mfeSharedDepsCssJson,
            },
          },
          'bootstrap_mfe'
        );

        const mfeBody = await mfeBootstrap.getJsFile();
        const mfeEtag = await mfeBootstrap.getJsFileHash();

        const response = h
          .response(mfeBody)
          .header('cache-control', 'must-revalidate')
          .header('content-type', 'application/javascript')
          .etag(mfeEtag);
        if (mfeBucketCookieToSet) {
          // Sticky HttpOnly cookie: same client gets the same bucket forever
          // (until the cookie is cleared), so canary assignment is deterministic
          // per browser. Future AuthN replaces this source with a per-user
          // hash — without changing the resolution contract.
          response.header('set-cookie', mfeBucketCookieToSet);
        }
        return response;
      }

      const kpUiPlugins = osdServer.newPlatform.__internals.uiPlugins;
      const kpPluginPublicPaths = new Map();
      const kpPluginBundlePaths = new Set();

      // recursively iterate over the kpUiPlugin ids and their required bundles
      // to populate kpPluginPublicPaths and kpPluginBundlePaths
      (function readKpPlugins(ids) {
        for (const id of ids) {
          if (kpPluginPublicPaths.has(id)) {
            continue;
          }

          kpPluginPublicPaths.set(id, `${regularBundlePath}/plugin/${id}/`);
          kpPluginBundlePaths.add(`${regularBundlePath}/plugin/${id}/${id}.plugin.js`);
          readKpPlugins(kpUiPlugins.internal.get(id).requiredBundles);
        }
      })(kpUiPlugins.public.keys());

      const jsDependencyPaths = [
        ...UiSharedDeps.jsDepFilenames.map(
          (filename) => `${regularBundlePath}/osd-ui-shared-deps/${filename}`
        ),
        `${regularBundlePath}/osd-ui-shared-deps/${UiSharedDeps.jsFilename}`,

        `${regularBundlePath}/core/core.entry.js`,
        ...kpPluginBundlePaths,
      ];

      // These paths should align with the bundle routes configured in
      // src/optimize/bundles_route/bundles_route.ts
      const publicPathMap = JSON.stringify({
        core: `${regularBundlePath}/core/`,
        'osd-ui-shared-deps': `${regularBundlePath}/osd-ui-shared-deps/`,
        ...Object.fromEntries(kpPluginPublicPaths),
      });

      const bootstrap = new AppBootstrap({
        templateData: {
          jsDependencyPaths,
          publicPathMap,
          basePath,
          regularBundlePath,
          UiSharedDeps,
          THEME_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.themeCssDistFilenames),
          KUI_CSS_DIST_FILENAMES: JSON.stringify(UiSharedDeps.kuiCssDistFilenames),
        },
      });

      const body = await bootstrap.getJsFile();
      const etag = await bootstrap.getJsFileHash();

      return h
        .response(body)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/javascript')
        .etag(etag);
    },
  });

  server.route({
    path: '/startup.js',
    method: 'GET',
    config: {
      tags: ['api'],
      auth: authEnabled ? { mode: 'try' } : false,
    },
    async handler(request, h) {
      const soClient = osdServer.newPlatform.start.core.savedObjects.getScopedClient(
        OpenSearchDashboardsRequest.from(request)
      );
      const uiSettings = osdServer.newPlatform.start.core.uiSettings.asScopedToClient(soClient);

      // coerce to booleans just in case, to make sure template vars render correctly
      const configEnableUserControl =
        !authEnabled || request.auth.isAuthenticated
          ? !!(await uiSettings.get('theme:enableUserControl'))
          : !!uiSettings.getOverrideOrDefault('theme:enableUserControl');

      const configDarkMode =
        !authEnabled || request.auth.isAuthenticated
          ? !!(await uiSettings.get('theme:darkMode'))
          : !!uiSettings.getOverrideOrDefault('theme:darkMode');

      const configThemeVersion =
        !authEnabled || request.auth.isAuthenticated
          ? await uiSettings.get('theme:version')
          : uiSettings.getOverrideOrDefault('theme:version');

      const LOADING_SCREEN_THEME_VARS = [
        'euiColorDarkShade',
        'euiColorFullShade',
        'euiColorLightestShade',
        'euiColorPrimary',
        'euiHeaderBackgroundColor',
      ];
      const getLoadingVars = (allThemeVars) => {
        const filteredVars = {};
        LOADING_SCREEN_THEME_VARS.forEach((key) => (filteredVars[key] = allThemeVars[key]));
        return filteredVars;
      };
      const THEME_SOURCES = JSON.stringify({
        v7: {
          light: getLoadingVars(v7light),
          dark: getLoadingVars(v7dark),
        },
        v8: {
          light: getLoadingVars(v8light),
          dark: getLoadingVars(v8dark),
        },
        v9: {
          light: getLoadingVars(v9light),
          dark: getLoadingVars(v9dark),
        },
      });

      /*
       * The fonts are added as CSS variables, overriding OUI's, and then
       * the CSS variables are consumed.
       */
      const fontText = JSON.stringify({
        v7: 'Inter UI',
        v8: 'Source Sans 3',
        v9: 'Rubik',
      });

      const fontCode = JSON.stringify({
        v7: 'Roboto Mono',
        v8: 'Source Code Pro',
        v9: 'Source Code Pro',
      });

      const startup = new AppBootstrap(
        {
          templateData: {
            configEnableUserControl,
            configDarkMode,
            configThemeVersion,
            defaultThemeVersion:
              UiSharedDeps.themeVersionValueMap[uiSettings.getDefault('theme:version')],
            THEME_VERSION_VALUE_MAP: JSON.stringify(UiSharedDeps.themeVersionValueMap),
            THEME_SOURCES,
            fontText,
            fontCode,
          },
        },
        'startup'
      );

      const body = await startup.getJsFile();
      const etag = await startup.getJsFileHash();

      return h
        .response(body)
        .header('cache-control', 'must-revalidate')
        .header('content-type', 'application/javascript')
        .etag(etag);
    },
  });

  server.route({
    path: '/app/{id}/{any*}',
    method: 'GET',
    async handler(req, h) {
      try {
        return await h.renderApp();
      } catch (err) {
        throw Boom.boomify(err);
      }
    },
  });

  async function renderApp(h) {
    const { http } = osdServer.newPlatform.setup.core;
    const { dynamicConfig } = osdServer.newPlatform.start.core;
    const { savedObjects } = osdServer.newPlatform.start.core;
    const { rendering } = osdServer.newPlatform.__internals;
    const req = OpenSearchDashboardsRequest.from(h.request);
    const uiSettings = osdServer.newPlatform.start.core.uiSettings.asScopedToClient(
      savedObjects.getScopedClient(req)
    );

    const nonce = randomBytes(16).toString('base64');

    const vars = {
      apmConfig: getApmConfig(h.request.path),
    };
    const content = await rendering.render(h.request, uiSettings, {
      includeUserSettings: true,
      vars,
      nonce,
    });

    // Phase 5 (docs/01-MFE-DESIGN.md §6/§7): in MFE mode, widen the served CSP
    // script-src/worker-src to the configured MFE origins (the CDN serving plugin
    // remoteEntry.js + chunks, plus the bootstrap/shared-deps script origins; and,
    // ONLY in non-prod when the allowOverride gate is on, the dev-override origins)
    // so the cross-origin MFE scripts can load. This is the SHIPPED-config
    // replacement for the old harness temp-yaml csp.rules hack. Without --mfe
    // (mfe.enabled false) the base rules/header are byte-for-byte unchanged.
    const mfeCspEnabled = !!config.get('opensearchDashboards.mfe.enabled');
    let cspRules = http.csp.rules;
    let cspHeader = http.csp.header;
    if (mfeCspEnabled) {
      const mfeAllowOverrideForCsp = resolveAllowOverride(
        config.get('opensearchDashboards.mfe.allowOverride'),
        !!server.newPlatform.env.mode.dev
      );
      cspRules = buildMfeCspRules(http.csp.rules, {
        cdnOrigin: config.get('opensearchDashboards.mfe.cdnOrigin'),
        bootstrapUrl: config.get('opensearchDashboards.mfe.bootstrapUrl'),
        sharedDepsUrl: config.get('opensearchDashboards.mfe.sharedDepsUrl'),
        allowOverride: mfeAllowOverrideForCsp,
        devOverrideOrigins: config.get('opensearchDashboards.mfe.devOverrideOrigins'),
      });
      cspHeader = cspRules.join('; ');
    }
    try {
      const dynamicConfigClient = dynamicConfig.getClient();
      const dynamicConfigStore = dynamicConfig.createStoreFromRequest(req);
      const cspModificationsDynamicConfig = await dynamicConfigClient.getConfig(
        { pluginConfigPath: 'csp-modifications' },
        dynamicConfigStore ? { asyncLocalStorageContext: dynamicConfigStore } : undefined
      );

      const modifications = cspModificationsDynamicConfig?.modifications;
      if (modifications && modifications.length > 0) {
        cspHeader = applyCspModifications(cspRules, modifications);
      }
    } catch (e) {
      // Fall back to default CSP header on error
    }

    const output = h
      .response(content)
      .type('text/html')
      .header('content-security-policy', cspHeader);

    let cspReportOnlyIsEmitting;
    try {
      const dynamicConfigClient = dynamicConfig.getClient();
      const dynamicConfigStore = dynamicConfig.createStoreFromRequest(req);
      const cspReportOnlyDynamicConfig = await dynamicConfigClient.getConfig(
        { pluginConfigPath: 'csp-report-only' },
        dynamicConfigStore ? { asyncLocalStorageContext: dynamicConfigStore } : undefined
      );
      cspReportOnlyIsEmitting =
        cspReportOnlyDynamicConfig.isEmitting ?? http.cspReportOnly.isEmitting;
    } catch (e) {
      cspReportOnlyIsEmitting = http.cspReportOnly.isEmitting;
    }

    if (cspReportOnlyIsEmitting) {
      const cspReportOnlyHeader = http.cspReportOnly.buildHeaderWithNonce(nonce);
      output.header('content-security-policy-report-only', cspReportOnlyHeader);

      if (http.cspReportOnly.reportingEndpointsHeader) {
        output.header('reporting-endpoints', http.cspReportOnly.reportingEndpointsHeader);
      }
    }

    return output;
  }

  server.decorate('toolkit', 'renderApp', function () {
    return renderApp(this);
  });
}
