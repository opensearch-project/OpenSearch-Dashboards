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
      registryUrl: schema.string({ defaultValue: '' }),
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
    }),
  }),
  deprecations,
};
