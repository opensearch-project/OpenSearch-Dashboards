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

import { CoreStart, CoreSetup } from 'opensearch-dashboards/public';
import { OpenSearchDashboardsLegacyStart } from 'src/plugins/opensearch_dashboards_legacy/public';
import { Subscription } from 'rxjs';
import { navigateToDefaultApp } from './navigate_to_default_app';
import { createLegacyUrlForwardApp, createLegacyUrlForwardCurrentApp } from './forward_app';
import { navigateToLegacyOpenSearchDashboardsUrl } from './forward_app/navigate_to_legacy_opensearch_dashboards_url';

export interface ForwardDefinition {
  legacyAppId: string;
  newAppId: string;
  rewritePath: (legacyPath: string) => string;
}

export class UrlForwardingPlugin {
  private forwardDefinitions: ForwardDefinition[] = [];
  private currentAppId: string | undefined;
  private currentAppIdSubscription: Subscription | undefined;

  public setup(core: CoreSetup<{}, UrlForwardingStart>) {
    core.application.register(createLegacyUrlForwardApp(core, this.forwardDefinitions));
    core.application.register(createLegacyUrlForwardCurrentApp(core, this.forwardDefinitions));
    return {
      /**
       * Forwards URLs within the legacy `opensearchDashboards` app to a new platform application.
       *
       * @param legacyAppId The name of the old app to forward URLs from
       * @param newAppId The name of the new app that handles the URLs now
       * @param rewritePath Function to rewrite the legacy sub path of the app to the new path in the core app.
       *        If none is provided, it will just strip the prefix of the legacyAppId away
       *
       * path into the new path
       *
       * Example usage:
       * ```
       * urlForwarding.forwardApp(
       *   'old',
       *   'new',
       *   path => {
       *     const [, id] = /old/item\/(.*)$/.exec(path) || [];
       *     if (!id) {
       *       return '#/home';
       *     }
       *     return '#/items/${id}';
       *  }
       * );
       * ```
       * This will cause the following redirects:
       *
       * * app/opensearch-dashboards#/old/ -> app/new#/home
       * * app/opensearch-dashboards#/old/item/123 -> app/new#/items/123
       *
       */
      forwardApp: (
        legacyAppId: string,
        newAppId: string,
        rewritePath?: (legacyPath: string) => string
      ) => {
        this.forwardDefinitions.push({
          legacyAppId,
          newAppId,
          rewritePath: rewritePath || ((path) => `#${path.replace(`/${legacyAppId}`, '') || '/'}`),
        });
      },
    };
  }

  public start(
    { application, http: { basePath }, uiSettings }: CoreStart,
    { opensearchDashboardsLegacy }: { opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart }
  ) {
    this.currentAppIdSubscription = application.currentAppId$.subscribe((currentAppId) => {
      this.currentAppId = currentAppId;
    });
    return {
      /**
       * Navigates to the app defined as opensearch-dashboards.defaultAppId.
       * This takes redirects into account and uses the right mechanism to navigate.
       */
      navigateToDefaultApp: (
        { overwriteHash }: { overwriteHash: boolean } = { overwriteHash: true }
      ) => {
        navigateToDefaultApp(
          opensearchDashboardsLegacy.config.defaultAppId,
          this.forwardDefinitions,
          application,
          basePath,
          this.currentAppId,
          overwriteHash
        );
      },
      /**
       * Resolves the provided hash using the registered forwards and navigates to the target app.
       * If a navigation happened, `{ navigated: true }` will be returned.
       * If no matching forward is found, `{ navigated: false }` will be returned.
       * @param hash
       */
      navigateToLegacyOpenSearchDashboardsUrl: (hash: string) => {
        return navigateToLegacyOpenSearchDashboardsUrl(
          hash,
          this.forwardDefinitions,
          basePath,
          application
        );
      },
      /**
       * @deprecated
       * Just exported for wiring up with legacy platform, should not be used.
       */
      getForwards: () => this.forwardDefinitions,
    };
  }

  public stop() {
    if (this.currentAppIdSubscription) {
      this.currentAppIdSubscription.unsubscribe();
    }
  }
}

export type UrlForwardingSetup = ReturnType<UrlForwardingPlugin['setup']>;
export type UrlForwardingStart = ReturnType<UrlForwardingPlugin['start']>;
