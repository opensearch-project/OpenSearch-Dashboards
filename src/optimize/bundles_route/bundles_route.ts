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

import { extname, join } from 'path';

import Hapi from '@hapi/hapi';
import * as UiSharedDeps from '@osd/ui-shared-deps';

import { createDynamicAssetResponse } from './dynamic_asset_response';
import { FileHashCache } from './file_hash_cache';
import { assertIsNpUiPluginPublicDirs, NpUiPluginPublicDirs } from '../np_ui_plugin_public_dirs';
import { fromRoot } from '../../core/server/utils';

/**
 *  Creates the routes that serves files from `bundlesPath`.
 *
 *  @param {Object} options
 *  @property {Array<{id,path}>} options.npUiPluginPublicDirs array of ids and paths that should be served for new platform plugins
 *  @property {string} options.regularBundlesPath
 *  @property {string} options.basePublicPath
 *  @property {() => boolean} [options.mfeCoreEntryRefuser] Phase 16 Story 5
 *    predicate: when supplied AND it returns `true` at request time, this
 *    bundles route refuses (404) the `core.entry.js` request inside the
 *    `/bundles/core/` route. Wired ONLY by the mfe-gated mixin (see
 *    `optimize_mixin.ts`): when `--mfe` is on AND the resolved v3 registry
 *    advertises a `core` descriptor, the orchestrator loads `core.entry.js`
 *    from the CDN URL itself, so the same artifact MUST NOT also be served
 *    from this origin (otherwise the browser would have two competing
 *    sources for the same bytes). The lazy `core.chunk.*.js` files are
 *    UNCHANGED — they remain on this origin and load through
 *    `__osdPublicPath__.core` exactly as before. When the predicate is
 *    absent OR returns `false`, the route is byte-for-byte unchanged
 *    (the no-flag :5601 path NEVER passes a refuser, so the legacy serve
 *    behaviour is preserved verbatim — verify_baseline 8/8 / verify_noflag
 *    EMPTY).
 *  @property {() => boolean} [options.mfeSharedDepsCssRefuser] Phase 16
 *    Story 7 predicate: when supplied AND it returns `true` at request
 *    time, this bundles route refuses (404) the `osd-ui-shared-deps.css`
 *    request inside the `/bundles/osd-ui-shared-deps/` route. Same wiring
 *    contract as `mfeCoreEntryRefuser` — set ONLY by the mfe-gated mixin
 *    when `--mfe` is on AND the resolved v3 registry advertises a
 *    `sharedDepsCss` descriptor (the orchestrator's `styleSheetPaths`
 *    loads the base CSS from the CDN URL with SRI; an un-SRI'd same-
 *    origin copy would silently downgrade the integrity gate). Refuses
 *    ONLY the BASE `osd-ui-shared-deps.css` file (NOT the per-theme
 *    variant CSS files, NOT the JS bundle, NOT lazy chunks — those stay
 *    on this origin). Absent / returning `false` ⇒ route is byte-for-
 *    byte unchanged.
 *
 *  @return Array.of({Hapi.Route})
 */
export function createBundlesRoute({
  basePublicPath,
  npUiPluginPublicDirs = [],
  buildHash,
  isDist = false,
  mfeCoreEntryRefuser,
  mfeSharedDepsCssRefuser,
}: {
  basePublicPath: string;
  npUiPluginPublicDirs?: NpUiPluginPublicDirs;
  buildHash: string;
  isDist?: boolean;
  mfeCoreEntryRefuser?: () => boolean;
  mfeSharedDepsCssRefuser?: () => boolean;
}) {
  // rather than calculate the fileHash on every request, we
  // provide a cache object to `resolveDynamicAssetResponse()` that
  // will store the 100 most recently used hashes.
  const fileHashCache = new FileHashCache();
  assertIsNpUiPluginPublicDirs(npUiPluginPublicDirs);

  if (typeof basePublicPath !== 'string') {
    throw new TypeError('basePublicPath must be a string');
  }

  if (!basePublicPath.match(/(^$|^\/.*[^\/]$)/)) {
    throw new TypeError('basePublicPath must be empty OR start and not end with a /');
  }

  return [
    buildRouteForBundles({
      publicPath: `${basePublicPath}/${buildHash}/bundles/osd-ui-shared-deps/`,
      routePath: `/${buildHash}/bundles/osd-ui-shared-deps/`,
      bundlesPath: UiSharedDeps.distDir,
      fileHashCache,
      isDist,
      // Phase 16 Story 7: refuse only the BASE `osd-ui-shared-deps.css`
      // (NOT the per-theme variant CSS files like
      // `osd-ui-shared-deps.v8.dark.css`, NOT the JS bundle, NOT lazy
      // chunks) when the registry advertises a CDN `sharedDepsCss`
      // descriptor. Symmetric with the core entry refuser below.
      refusePath: mfeSharedDepsCssRefuser
        ? (assetPath: string) => assetPath === 'osd-ui-shared-deps.css' && mfeSharedDepsCssRefuser()
        : undefined,
    }),
    ...npUiPluginPublicDirs.map(({ id, path }) =>
      buildRouteForBundles({
        publicPath: `${basePublicPath}/${buildHash}/bundles/plugin/${id}/`,
        routePath: `/${buildHash}/bundles/plugin/${id}/`,
        bundlesPath: path,
        fileHashCache,
        isDist,
      })
    ),
    buildRouteForBundles({
      publicPath: `${basePublicPath}/${buildHash}/bundles/core/`,
      routePath: `/${buildHash}/bundles/core/`,
      bundlesPath: fromRoot(join('src', 'core', 'target', 'public')),
      fileHashCache,
      isDist,
      // Phase 16 Story 5: refuse only `core.entry.js` (NOT the lazy
      // `core.chunk.*.js` files) when the registry advertises a CDN `core`
      // descriptor. The lazy chunks stay on this origin because
      // `__osdPublicPath__.core` keeps pointing at this route's base.
      refusePath: mfeCoreEntryRefuser
        ? (assetPath: string) => assetPath === 'core.entry.js' && mfeCoreEntryRefuser()
        : undefined,
    }),
  ];
}

function buildRouteForBundles({
  publicPath,
  routePath,
  bundlesPath,
  fileHashCache,
  isDist,
  refusePath,
}: {
  publicPath: string;
  routePath: string;
  bundlesPath: string;
  fileHashCache: FileHashCache;
  isDist: boolean;
  /**
   * Phase 16 Story 5 + Story 7: optional per-request 404 gate. When
   * supplied, the `onPreHandler` checks it BEFORE delegating to
   * `createDynamicAssetResponse` (and BEFORE the Inert directory handler
   * can serve the file). Returning `true` aborts the request with
   * `404 not found`. When absent, the route is byte-for-byte unchanged
   * (legacy no-flag behaviour preserved verbatim). Story 5 wires this
   * for `core.entry.js` on the `/bundles/core/` route; Story 7 wires it
   * for `osd-ui-shared-deps.css` on the `/bundles/osd-ui-shared-deps/`
   * route — same mechanism, different artifact path.
   */
  refusePath?: (assetPath: string) => boolean;
}) {
  return {
    method: 'GET',
    path: `${routePath}{path*}`,
    config: {
      auth: false,
      ext: {
        onPreHandler: {
          method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
            const ext = extname(request.params.path);

            // Phase 16 Story 5 + Story 7: refuse this asset path BEFORE
            // any disk read when the mfe-gated refuser predicate says so.
            // The check fires before `createDynamicAssetResponse` AND
            // before the route's fallback Inert directory handler (which
            // would otherwise happily serve the same artifact from disk).
            // Returning h.response(...).code(404).takeover() short-
            // circuits the request — Hapi will NOT invoke the underlying
            // handler. Used by both the core entry refuser (Story 5) and
            // the base shared-deps CSS refuser (Story 7).
            if (refusePath && refusePath(request.params.path)) {
              return h.response('not found').code(404).takeover();
            }

            if (ext !== '.js' && ext !== '.css') {
              return h.continue;
            }

            return createDynamicAssetResponse({
              request,
              h,
              bundlesPath,
              fileHashCache,
              publicPath,
              isDist,
            });
          },
        },
      },
    },
    handler: {
      directory: {
        path: bundlesPath,
        listing: false,
        lookupCompressed: true,
      },
    },
  };
}
