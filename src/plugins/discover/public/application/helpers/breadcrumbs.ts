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

import { i18n } from '@osd/i18n';
import { EuiBreadcrumb } from '@elastic/eui';
import { getServices } from '../../opensearch_dashboards_services';
import { clearSavedSearch, updateIndexPattern } from '../utils/state_management';
import type { DiscoverViewServices } from '../../build_services';
import { LAST_INDEX_PATTERN_KEY } from './constants';

/**
 * When viewing a saved search, clicking the Discover breadcrumb should return to
 * Discover root with a fresh state (no saved search) and restore the previous index pattern.
 * Using navigateToApp to the same app does not remount, so Redux state (savedSearch) persists unless we clear it.
 *
 * When services with store and scopedHistory are provided (e.g. from Discover canvas),
 * we clear filters, restore the last index pattern (from sessionStorage), clear query,
 * replace the URL, and clear savedSearch.
 * When services are not provided (e.g. doc views mounted outside data-explorer), we fall back to
 * full app navigation.
 */
export function getRootBreadcrumbs(services?: DiscoverViewServices): EuiBreadcrumb[] {
  const { core, filterManager, data } = getServices();
  const store = services?.store;
  const scopedHistory = services?.scopedHistory;
  const isOnDiscoverRoot = store && scopedHistory && !store.getState().discover?.savedSearch;

  const discoverBreadcrumb: EuiBreadcrumb = {
    text: i18n.translate('discover.rootBreadcrumb', {
      defaultMessage: 'Discover',
    }),
    ...(isOnDiscoverRoot
      ? {}
      : {
          onClick: async () => {
            filterManager.setAppFilters([]);
            data.query.queryString.setQuery({ query: '' }, false, true);
            if (store && scopedHistory) {
              const savedId = sessionStorage.getItem(LAST_INDEX_PATTERN_KEY);
              // Core does not currently expose analytics.reportEvent; this is a no-op until that API exists.
              const analytics = (core as { analytics?: { reportEvent?: (name: string, payload?: object) => void } })
                .analytics;
              analytics?.reportEvent?.('discover_breadcrumb_navigation', {
                from_saved_search: !!store.getState().discover?.savedSearch,
                restored_index_pattern: !!savedId,
              });
              if (savedId) {
                try {
                  const pattern = await data.indexPatterns.get(savedId);
                  if (pattern) store.dispatch(updateIndexPattern(savedId));
                } catch (_) {
                  // Pattern was deleted or invalid; skip restore so we don't dispatch a bad id.
                  // User still lands on Discover root; state keeps previous id or use_index_pattern handles it.
                }
              }
              store.dispatch(clearSavedSearch());
              scopedHistory.replace('/discover#/');
            } else {
              core.application.navigateToApp('data-explorer', { path: 'discover' });
            }
          },
        }),
  };

  return [discoverBreadcrumb];
}
