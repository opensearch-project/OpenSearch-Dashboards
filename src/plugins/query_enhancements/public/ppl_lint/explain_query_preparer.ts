/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PrepareExplainQuery } from '@osd/monaco';
import { DataPublicPluginStart, IIndexPattern, Query, UI_SETTINGS } from '../../../data/public';
import { IUiSettingsClient } from '../../../../core/public';
import { isPPLSearchQuery } from '../../common';
import { PPLFilterUtils } from '../search/filters';

/**
 * The apps whose dashboard filters the search interceptor folds into a PPL query.
 * Mirrors `PPLSearchInterceptor.filterManagerSupportedAppNames` so the explained
 * query matches what actually runs.
 */
const FILTER_MANAGER_SUPPORTED_APP_NAMES = ['dashboards'];

const INDEX_PATTERN_DATASET_TYPES = ['INDEXES', 'INDEX_PATTERN'];

interface PreparerServices {
  data: DataPublicPluginStart;
  uiSettings: IUiSettingsClient;
  /** Current app id (from `core.application.currentAppId$`); decides dashboard-filter folding. */
  getAppId: () => string | undefined;
}

/**
 * Prepend `source = <dataset>` to a query that does not already have a source,
 * mirroring the editor-seed / `getInitialQueryString` behavior so a leading-pipe
 * query (`| where ...`) explains against a real source. `describe`/`show` and
 * already-sourced queries are returned unchanged. INDEXES / INDEX_PATTERN dataset
 * titles are backtick-wrapped (sql#4444/#4445), matching the host source clause.
 */
function prependSource(raw: string, dataset: Query['dataset']): string {
  const lower = raw.toLowerCase();
  const hasSource = /^[^|]*\bsource\s*=/.test(lower);
  const hasDescribe = /^\s*describe\s+/.test(lower);
  const hasShow = /^\s*show\s+/.test(lower);
  if (hasSource || hasDescribe || hasShow || !dataset?.title) {
    return raw;
  }
  const title = INDEX_PATTERN_DATASET_TYPES.includes(dataset.type)
    ? `\`${dataset.title}\``
    : dataset.title;
  return raw.trim() === '' ? `source = ${title}` : `source = ${title} ${raw}`;
}

/**
 * Build a {@link PrepareExplainQuery} that reproduces what
 * `PPLSearchInterceptor.buildQuery` runs, so the explain-backed lint rules plan
 * the query that actually executes.
 *
 * Returns `{ query, cacheKey }`:
 * - `query` is the fully-prepared text: source-prepend, then the dashboard
 *   filters (only in a filter-manager app), then the time-range filter.
 * - `cacheKey` omits the time-range clause, so the cached `_explain` plan is
 *   reused across time-picker moves — pushdown behavior is a property of the
 *   operation, not the concrete time bounds. Dashboard filters DO stay in the
 *   key because adding/removing a filter can change the plan.
 *
 * The S3 async `head` limit is deliberately not added: it is `EnumerableLimit`
 * plumbing that does not change pushdown classification, and adding it would only
 * grow the key.
 */
export function createExplainQueryPreparer(services: PreparerServices): PrepareExplainQuery {
  const { data, uiSettings, getAppId } = services;

  return (raw: string) => {
    const currentQuery = data.query.queryString.getQuery();
    const dataset = currentQuery.dataset;
    const withSource = prependSource(raw, dataset);

    // Non-search queries (describe/show) never get filters, mirroring buildQuery.
    if (!isPPLSearchQuery({ ...currentQuery, query: withSource })) {
      return { query: withSource, cacheKey: withSource };
    }

    // Dashboard filters — only in a filter-manager app (e.g. dashboards).
    const appId = getAppId();
    let stableQuery = withSource;
    if (appId && FILTER_MANAGER_SUPPORTED_APP_NAMES.includes(appId)) {
      const filters = data.query.filterManager.getFilters();
      const indexPattern: IIndexPattern | undefined = dataset?.title
        ? data.indexPatterns.getByTitle(dataset.title, true)
        : undefined;
      const whereCommand = PPLFilterUtils.convertFiltersToWhereClause(
        filters,
        indexPattern,
        uiSettings.get(UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX)
      );
      stableQuery = PPLFilterUtils.insertWhereCommand(stableQuery, whereCommand);
    }

    // Time-range filter — folded into `query` only, kept out of `cacheKey`.
    let query = stableQuery;
    const datasetService = data.query.queryString.getDatasetService();
    if (
      dataset?.timeFieldName &&
      datasetService.getType(dataset.type)?.languageOverrides?.PPL?.hideDatePicker !== false
    ) {
      const timeFilter = PPLFilterUtils.getTimeFilterWhereClause(
        dataset.timeFieldName,
        data.query.timefilter.timefilter.getTime(),
        dataset.dataSource?.engineType ?? dataset.dataSource?.type
      );
      query = PPLFilterUtils.insertWhereCommand(stableQuery, timeFilter);
    }

    return { query, cacheKey: stableQuery };
  };
}
