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

import Hapi from '@hapi/hapi';

import { createBundlesRoute } from './bundles_route';
import { getNpUiPluginPublicDirs } from './np_ui_plugin_public_dirs';
import OsdServer, { OpenSearchDashboardsConfig } from '../legacy/server/osd_server';
import { readMfeBootManifest } from '../core/server/utils/mfe_boot_manifest';

export const optimizeMixin = async (
  osdServer: OsdServer,
  server: Hapi.Server,
  config: OpenSearchDashboardsConfig
) => {
  // Phase 16 Story 5: when `--mfe` is on AND the resolved v3 registry
  // advertises a `core` top-level field, the OSD orchestrator loads
  // `core.entry.js` from that CDN URL (with SRI) BEFORE invoking core boot.
  // The same artifact MUST NOT also be served by THIS server out of the
  // legacy `/bundles/core/core.entry.js` route (otherwise the browser has
  // two competing sources). The refuser predicate below is plumbed into
  // `createBundlesRoute` so the core bundle route 404s ONLY `core.entry.js`
  // (NOT the lazy `core.chunk.*.js` files — those stay on this origin and
  // load via `__osdPublicPath__.core`).
  //
  // When `--mfe` is OFF, or no registry path is configured, or the doc has
  // no `core` field, this predicate returns `false` and the route is
  // byte-for-byte unchanged (no-flag :5601 / pre-Phase-16 deployments).
  // Dimensions for `readMfeBootManifest` are FIXED here: `core` is a
  // GLOBAL v3 field (does not vary by tenant or canary bucket — see
  // schema_v3.ts §"Why GLOBAL, not per-layer"), so per-request dimensions
  // are irrelevant for this projection. The mtime-cache makes the read
  // O(1) for cache hits, so the per-request cost is a stat() of the
  // registry file plus a hash map lookup.
  const mfeCoreEntryRefuser: (() => boolean) | undefined = (() => {
    const mfeEnabled = !!config.get('opensearchDashboards.mfe.enabled');
    if (!mfeEnabled) return undefined;
    const mfeRegistryPath = config.get('opensearchDashboards.mfe.registryPath');
    if (!mfeRegistryPath || typeof mfeRegistryPath !== 'string') return undefined;
    return () => {
      try {
        const resolved = readMfeBootManifest(mfeRegistryPath, {
          customerId: 'default',
          userBucket: 0,
        });
        return !!resolved.core;
      } catch {
        // A read/parse failure means we cannot say whether the registry
        // advertises core — be conservative and DO serve the legacy path
        // so the app degrades to byte-for-byte-pre-Phase-16 instead of
        // 404-ing core in a confused state. The bootstrap handler in
        // ui_render_mixin already logs the underlying parse error.
        return false;
      }
    };
  })();

  server.route(
    createBundlesRoute({
      basePublicPath: config.get('server.basePath'),
      npUiPluginPublicDirs: getNpUiPluginPublicDirs(osdServer),
      buildHash: osdServer.newPlatform.env.packageInfo.buildNum.toString(),
      isDist: osdServer.newPlatform.env.packageInfo.dist,
      mfeCoreEntryRefuser,
    })
  );

  // Phase 16 Story 6: when `--mfe` is on AND the resolved v3 registry
  // advertises a `themes` map (e.g. `{ light: { url, integrity }, dark: {...} }`),
  // the legacy `/ui/legacy_<name>_theme.css` route on THIS server MUST 404 for
  // any theme name the registry knows. Two reasons:
  //   1) The orchestrator's HTML head injection (`<meta name="osd-mfe-themes">`)
  //      lets `startup.js` create the canonical `<link rel="stylesheet">` from
  //      the CDN URL with SRI BEFORE bootstrap.js runs. If this origin ALSO
  //      served the same artifact, a stale-cache miss could let the browser
  //      pick up an un-SRI'd copy and silently downgrade the integrity gate.
  //   2) Symmetry with Story 5's bundle-route core refuser: the same gate
  //      "registry advertises ⇒ legacy route 404s" is applied consistently
  //      across core / themes / shared-deps-css.
  //
  // We do NOT register a Hapi route here; we add a SERVER-LEVEL `onRequest`
  // extension that short-circuits the request BEFORE the existing
  // `/ui/{path*}` static-dir route (registered by `core_app.ts`) ever sees
  // it. Three properties matter:
  //   - Only THIS path family is intercepted (regex anchored to
  //     `/ui/legacy_<name>_theme.css`); every other `/ui/...` request is
  //     untouched (logos, fonts, branding assets, …).
  //   - Only theme NAMES the registry ADVERTISES are refused. A registry
  //     that knows only `light` still serves `legacy_dark_theme.css` from
  //     this origin when a user toggles dark mode (partial coverage
  //     degrades cleanly rather than blanking the page — same fail-soft
  //     posture as Story 5's predicate on a parse error).
  //   - The mtime cache in `mfe_boot_manifest.ts` makes the per-request
  //     cost O(1) for cache hits, so this is essentially a stat() on the
  //     registry file plus a map lookup. Themes are GLOBAL in v3 (see
  //     schema_v3.ts §"Why GLOBAL, not per-layer"), so fixed dimensions
  //     are sound.
  //
  // When `--mfe` is OFF, or no registry path is configured, the refuser
  // is `undefined` and we do NOT register the extension at all — the
  // no-flag :5601 path is byte-for-byte unchanged.
  const mfeThemeRefuser: ((themeName: string) => boolean) | undefined = (() => {
    const mfeEnabled = !!config.get('opensearchDashboards.mfe.enabled');
    if (!mfeEnabled) return undefined;
    const mfeRegistryPath = config.get('opensearchDashboards.mfe.registryPath');
    if (!mfeRegistryPath || typeof mfeRegistryPath !== 'string') return undefined;
    return (themeName: string) => {
      try {
        const resolved = readMfeBootManifest(mfeRegistryPath, {
          customerId: 'default',
          userBucket: 0,
        });
        return !!(resolved.themes && resolved.themes[themeName]);
      } catch {
        // Conservative fail-soft: a read/parse failure ⇒ DO NOT refuse;
        // the legacy route still serves the same-origin copy so the app
        // degrades to pre-Phase-16 byte-for-byte instead of 404-ing
        // themes in a confused state. The bootstrap handler already logs
        // the underlying parse error.
        return false;
      }
    };
  })();

  if (mfeThemeRefuser) {
    const LEGACY_THEME_PATH_RE = /^\/ui\/legacy_([^/]+)_theme\.css$/;
    server.ext('onRequest', (request, h) => {
      const match = LEGACY_THEME_PATH_RE.exec(request.path);
      if (match && mfeThemeRefuser(match[1])) {
        return h.response('not found').code(404).takeover();
      }
      return h.continue;
    });
  }
};
