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
 * Backtick-wrap an unquoted source clause for INDEXES / INDEX_PATTERN datasets,
 * mirroring the `hasSource` branch of explore's `addPPLSourceClause`
 * (get_query_with_source.ts — the canonical copy; kept in sync by hand because
 * query_enhancements cannot depend on the explore plugin). Only the pre-pipe
 * prefix is rewritten, so field comparisons like `| where source=prod` are
 * untouched. Without this, an already-sourced query would explain unquoted
 * while the host executes it backtick-wrapped (sql#4444/#4445).
 */
function backtickWrapSource(queryString: string): string {
  const pipeIndex = queryString.indexOf('|');
  const prefix = pipeIndex === -1 ? queryString : queryString.slice(0, pipeIndex);
  const suffix = pipeIndex === -1 ? '' : queryString.slice(pipeIndex);
  const updatedPrefix = prefix.replace(
    /(\bsource\s*=\s*)(`[^`]+`|[^\s|,]+(?:\s*,\s*[^\s|,]+)*,?)/i,
    (_match, srcPrefix, sourceValue) => {
      if (sourceValue.includes('`')) return _match;
      // Unquoted — normalize commas and wrap in backticks
      const normalizedSource = sourceValue.replace(/\s*,\s*/g, ',');
      return `${srcPrefix}\`${normalizedSource}\``;
    }
  );
  return updatedPrefix + suffix;
}

/**
 * Prepend `source = <dataset>` to a query that does not already have a source,
 * mirroring the editor-seed / `getInitialQueryString` behavior so a leading-pipe
 * query (`| where ...`) explains against a real source. `describe`/`show` are
 * returned unchanged. INDEXES / INDEX_PATTERN dataset titles are backtick-wrapped
 * (sql#4444/#4445), matching the host source clause — including an existing
 * unquoted source clause, which the host also rewrites before executing.
 */
function prependSource(raw: string, dataset: Query['dataset']): string {
  const lower = raw.toLowerCase();
  const hasSource = /^[^|]*\bsource\s*=/.test(lower);
  const hasDescribe = /^\s*describe\s+/.test(lower);
  const hasShow = /^\s*show\s+/.test(lower);
  const isIndexDataset =
    dataset !== undefined && INDEX_PATTERN_DATASET_TYPES.includes(dataset.type);
  if (hasSource) {
    return isIndexDataset ? backtickWrapSource(raw) : raw;
  }
  if (hasDescribe || hasShow || !dataset?.title) {
    return raw;
  }
  const title = isIndexDataset ? `\`${dataset.title}\`` : dataset.title;
  return raw.trim() === '' ? `source = ${title}` : `source = ${title} ${raw}`;
}

/**
 * Build a {@link PrepareExplainQuery} that reproduces what
 * `PPLSearchInterceptor.buildQuery` runs, so the explain-backed lint rules plan
 * the query that actually executes.
 *
 * Returns `{ query, cacheKey, injectedWhereCount }`:
 * - `query` is the fully-prepared text: source-prepend, then the dashboard
 *   filters (only in a filter-manager app), then the time-range filter.
 * - `cacheKey` omits the time-range clause, so the cached `_explain` plan is
 *   reused across time-picker moves — pushdown behavior is a property of the
 *   operation, not the concrete time bounds. Dashboard filters DO stay in the
 *   key because adding/removing a filter can change the plan.
 * - `injectedWhereCount` is how many `where` commands were folded in beyond the
 *   editor text, so the attribution layer knows the plan may contain filter
 *   operations with no editor counterpart and does not pin such an outcome on
 *   the user's only filter without a probe.
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
      return { query: withSource, cacheKey: withSource, injectedWhereCount: 0 };
    }

    let injectedWhereCount = 0;

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
      if (stableQuery !== withSource) {
        injectedWhereCount++;
      }
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
      if (query !== stableQuery) {
        injectedWhereCount++;
      }
    }

    return { query, cacheKey: stableQuery, injectedWhereCount };
  };
}
