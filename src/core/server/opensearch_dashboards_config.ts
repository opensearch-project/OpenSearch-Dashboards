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

import { schema, TypeOf } from '@osd/config-schema';
import { ConfigDeprecationProvider } from 'packages/osd-config';

export type OpenSearchDashboardsConfigType = TypeOf<typeof config.schema>;

const deprecations: ConfigDeprecationProvider = ({ renameFromRoot }) => [
  renameFromRoot('kibana.enabled', 'opensearchDashboards.enabled'),
  renameFromRoot('kibana.index', 'opensearchDashboards.index'),
  renameFromRoot(
    'kibana.autocompleteTerminateAfter',
    'opensearchDashboards.autocompleteTerminateAfter'
  ),
  renameFromRoot('kibana.autocompleteTimeout', 'opensearchDashboards.autocompleteTimeout'),
];

export const config = {
  path: 'opensearchDashboards',
  schema: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    index: schema.string({ defaultValue: '.kibana' }),
    configIndex: schema.string({ defaultValue: '.opensearch_dashboards_config' }),
    autocompleteTerminateAfter: schema.duration({ defaultValue: 100000 }),
    autocompleteTimeout: schema.duration({ defaultValue: 1000 }),
    branding: schema.object({
      logo: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      mark: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      loadingLogo: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      faviconUrl: schema.string({
        defaultValue: '/',
      }),
      applicationTitle: schema.string({
        defaultValue: '',
      }),
      useExpandedHeader: schema.boolean({
        defaultValue: true,
      }),
    }),
    survey: schema.object({
      url: schema.string({
        defaultValue: 'https://survey.opensearch.org',
      }),
    }),
    dashboardAdmin: schema.object({
      groups: schema.arrayOf(schema.string(), {
        defaultValue: [],
      }),
      users: schema.arrayOf(schema.string(), {
        defaultValue: [],
      }),
    }),
    futureNavigation: schema.boolean({ defaultValue: false }),
    keyboardShortcuts: schema.object({
      enabled: schema.boolean({ defaultValue: true }),
    }),
    // Phase 3 Micro-Frontend (MFE) mode. When `enabled`, OSD boots its UI from
    // Module Federation remotes served by an external origin instead of loading
    // the locally-bundled plugin scripts. This is OFF by default; with it off the
    // server's rendered HTML and bootstrap are byte-for-byte unchanged.
    // See docs/01-MFE-DESIGN.md §6.
    mfe: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      // URL of the dynamic MFE registry document, read at serve time (GET /registry
      // on the origin). The browser MFE bootstrap fetches this per page load, so a
      // registry version edit is reflected on reload with no rebuild/restart.
      // Phase 13 cut-over: when `registryPath` (below) is set, the OSD server
      // reads the registry server-side and INJECTS a flat boot manifest into the
      // bootstrap; the browser does not fetch this URL. Kept around for backward
      // compatibility with pre-Phase-13 injected pages.
      registryUrl: schema.string({ defaultValue: '' }),
      // Phase 13: file path to the registry document on disk (v2 shape; a v1
      // canonical doc is auto-migrated on read). When set, the OSD server reads
      // this on each /bootstrap.js render, resolves it server-side against the
      // requesting host's dimensions (`customerId` + `userBucket`), and bakes
      // the resulting flat boot manifest into the bootstrap script. The browser
      // does NOT fetch a registry document in this mode (verify_phase13 case G).
      registryPath: schema.string({ defaultValue: '' }),
      // Phase 13: tenant identifier. Default `"default"` until real AuthN.
      // Drives the `tenantOverrides[customerId]` resolution layer.
      customerId: schema.string({ defaultValue: 'default' }),
      // Phase 13: name of the sticky HttpOnly cookie OSD uses to derive the
      // `userBucket` (0..99) for canary traffic-shifting. Set on first request
      // and reused on subsequent requests so the assignment is stable per client.
      userBucketCookieName: schema.string({ defaultValue: '_osd_mfe_bucket' }),
      // URL of the shared-deps bundle (assigns `window.__osdSharedDeps__`) served by
      // the origin's /shared-deps/.
      sharedDepsUrl: schema.string({ defaultValue: '' }),
      // URL of the browser MFE bootstrap bundle (exposes `window.__osdBootstrapMfe__`).
      bootstrapUrl: schema.string({ defaultValue: '' }),
      // Non-production security GATE for dev URL-overrides (Phase 5, §7). When
      // true, runtime overrides (`?mfe.<id>=<url>`, the dev inspector,
      // `localStorage`) are honored so a developer can repoint a single MFE at a
      // local dev server; when false, ALL override sources are IGNORED and every
      // plugin loads from the registry/CDN. Left UNSET here (no default) so the
      // effective value defaults to the server's dev mode at injection time
      // (resolveAllowOverride: dev => true, prod => false); an explicit boolean
      // always wins. This is the boundary that keeps arbitrary remote code out of
      // production.
      allowOverride: schema.maybe(schema.boolean()),
      // CDN origin serving the plugin remoteEntry.js + chunks. When MFE mode is on
      // it is allow-listed in the served CSP script-src/worker-src (together with the
      // bootstrap/shared-deps script origins, derived from their URLs) so the
      // cross-origin MFE scripts can load. Empty default => no CSP change. This is the
      // shipped-config replacement for the Phase 3/4 harness temp-yaml csp.rules hack.
      cdnOrigin: schema.string({ defaultValue: '' }),
      // Extra script origins allow-listed in the CSP ONLY in non-prod (when the
      // allowOverride gate is on) so a developer can repoint an MFE at a local dev
      // server. NEVER applied in production. Empty default.
      devOverrideOrigins: schema.arrayOf(schema.string(), { defaultValue: [] }),
      // Phase 12 Story 4: registry AUTHENTICITY (signing). The registry document
      // decides WHICH remote code each plugin loads, so it is signed with a key the
      // CDN tamperer lacks (an HMAC secret held HERE in server config, never inside
      // the signed payload) and the browser MFE bootstrap verifies the signature at
      // read time, BEFORE using the registry — refusing a tampered/unsigned registry
      // fail-closed. `verificationKey` empty (the default) => signing OFF: the
      // registry loads unverified exactly as before (backward compatible, like a
      // missing per-artifact integrity). When set (and mfe.enabled), the bootstrap
      // REQUIRES a matching signature. The key is delivered to the browser by THIS
      // trusted OSD origin (not the CDN), which is what defeats a compromised-CDN /
      // MITM serving altered registry bytes. Key issuance/rotation/custody (and a
      // stronger asymmetric model where the browser holds only a public key) are
      // deferred to Phase 13. Injected only inside the mfe-enabled render branch, so
      // the no-flag served HTML stays byte-for-byte unchanged.
      registrySignature: schema.object({
        // The HMAC secret used to verify the registry signature. Empty => signing off.
        verificationKey: schema.string({ defaultValue: '' }),
        // Identifier of the expected signing key (informational; Phase-13 rotation hook).
        keyId: schema.string({ defaultValue: 'mfe-dev-hmac-1' }),
        // Signature algorithm; only HMAC-SHA256 is supported today.
        algorithm: schema.string({ defaultValue: 'HMAC-SHA256' }),
      }),
      // Phase 9 version-compatibility POLICY. Controls how the MFE host reacts
      // when a remote is built against an incompatible OSD core / shared-singleton
      // version, or is missing the compatibility metadata. The env-keyed DEFAULTS
      // (resolved at injection time by `resolveCompatPolicy`, mirroring the
      // `allowOverride` dev/prod gate) are: onIncompatible => dev `block` / prod
      // `skip`; onMissing => dev `warn-load` / prod `skip`. Both are left UNSET
      // here (no default) so the effective value tracks the server's dev mode;
      // an explicit value always wins. `strictShared` (singleton version strictly
      // enforced) is not env-keyed and defaults to `true` — a detected mismatch is
      // then handled by the same onIncompatible action, so strict never
      // white-screens prod. See docs/01-MFE-DESIGN.md and prd.json (Phase 9).
      compat: schema.object({
        // INCOMPATIBLE (known) remote: `block` the whole page (loud, list
        // offenders) or `skip` the plugin (page keeps working).
        onIncompatible: schema.maybe(
          schema.oneOf([schema.literal('block'), schema.literal('skip')])
        ),
        // MISSING/UNKNOWN compatibility metadata: `block`, `skip`, or `warn-load`
        // (load anyway with a warning).
        onMissing: schema.maybe(
          schema.oneOf([
            schema.literal('block'),
            schema.literal('skip'),
            schema.literal('warn-load'),
          ])
        ),
        // Enforce strict shared-singleton versions (never silently run a
        // mismatched singleton). Defaults to true.
        strictShared: schema.boolean({ defaultValue: true }),
      }),
    }),
  }),
  deprecations,
};
