/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Filter, getTime, TimeRange, UI_SETTINGS } from '../../../data/public';
import { DEFAULT_DATA, Dataset } from '../../../data/common';
import { RequestAdapter } from '../../../inspector/public';
import { ExploreServices } from '../types';
import { SAMPLE_SIZE_SETTING } from '../../common';
import {
  getRequestInspectorStats,
  getResponseInspectorStats,
} from '../application/legacy/discover/opensearch_dashboards_services';
import { prepareQueryForLanguage } from '../application/utils/languages';
import { shouldSkipQueryExecution } from '../application/utils/state_management/actions/query_actions';
import { QueryState } from '../application/in_context_vis_editor/query_builder/query_builder';
import {
  withLanguageQueryOptions,
  withRowRefId,
  shouldPrefixSeriesWithRefId,
} from '../application/in_context_vis_editor/query_builder/utils';
import { ContainerState } from '../application/in_context_vis_editor/multi_query_builder/container_state_utils';
import { hitsToSeriesResult } from '../components/visualizations/utils/normalize_result_rows';
import type {
  SeriesResult,
  UrlRowEntry,
} from '../application/in_context_vis_editor/multi_query_builder/types';

export interface SavedQueriesFetchOptions {
  services: ExploreServices;
  /** The dashboard's filters, applied to every row. */
  filters?: Filter[];
  /** The panel's time range, applied to every time-based row. */
  timeRange?: TimeRange;
  signal: AbortSignal;
  /** Replaces dashboard variables in a row's query text. */
  interpolate: (query: string, language?: string) => string;
  /** One inspector request per row. */
  requests?: RequestAdapter;
}

export interface SavedQueriesFetchResult {
  /** The rows that returned results, in row order. */
  series: SeriesResult[];
  failed: Array<{ refId: string; error: unknown }>;
}

export const getVisibleSavedRows = (state: ContainerState): Array<UrlRowEntry<QueryState>> => {
  const hidden = new Set(
    state.editorState.rows.filter(([, row]) => row.isHidden).map(([refId]) => refId)
  );
  return state.queries.filter(([refId]) => !hidden.has(refId));
};

// Same as vis editor: index patterns load from saved objects; other dataset types (indexes,
// Prometheus) only from the cache, so cache the dataset first.
const getRowDataView = async (services: ExploreServices, dataset: Dataset) => {
  const { dataViews, query } = services.data;
  const onlyCheckCache = dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN;
  const cached = await dataViews.get(dataset.id, onlyCheckCache);
  if (cached) return cached;
  await query.queryString.getDatasetService().cacheDataset(
    dataset,
    {
      uiSettings: services.uiSettings,
      savedObjects: services.savedObjects,
      notifications: services.notifications,
      http: services.http,
      data: services.data,
    },
    false,
    dataset.signalType
  );
  return dataViews.get(dataset.id, onlyCheckCache);
};

/**
 * Runs a saved visualization's rows for its dashboard panel, the way the visualization editor runs
 * them: each row on its own data view and query (dashboard variables replaced), with the panel's
 * filters and time range, all in parallel. A row without a dataset or with an empty query is
 * skipped; a failing row is reported and doesn't stop the others.
 */
export const fetchSavedQueries = async (
  rows: Array<UrlRowEntry<QueryState>>,
  { services, filters = [], timeRange, signal, interpolate, requests }: SavedQueriesFetchOptions
): Promise<SavedQueriesFetchResult> => {
  // PromQL rows carry their refId only when two or more of them run.
  const prefixSeriesWithRefId = shouldPrefixSeriesWithRefId(rows.map(([, query]) => query));

  const runRow = async ([refId, query]: UrlRowEntry<QueryState>): Promise<
    SeriesResult | undefined
  > => {
    if (!query.dataset || shouldSkipQueryExecution(query)) return undefined;

    const dataView = await getRowDataView(services, query.dataset);
    if (!dataView) {
      throw new Error(
        i18n.translate('explore.embeddable.savedQueries.datasetNotFound', {
          defaultMessage: 'Query {refId}: dataset {dataset} not found',
          values: { refId, dataset: query.dataset.title },
        })
      );
    }

    const queryString = interpolate(prepareQueryForLanguage(query).query, query.language);
    const searchSource = await services.data.search.searchSource.create();
    const timeFilter = timeRange ? getTime(dataView, timeRange) : undefined;
    searchSource.setFields({
      index: dataView,
      size: services.uiSettings.get(SAMPLE_SIZE_SETTING),
      // The row's own language, dataset and options (e.g. PromQL's max data points), not the
      // global query string's.
      query: {
        ...(prefixSeriesWithRefId
          ? withRowRefId(withLanguageQueryOptions(query), refId)
          : withLanguageQueryOptions(query)),
        dataset: await services.data.dataViews.convertToDataset(dataView),
        query: queryString,
      },
      filter: timeFilter ? [...filters, timeFilter] : filters,
      highlightAll: true,
      version: true,
    });

    const request = requests?.start(
      i18n.translate('explore.embeddable.savedQueries.inspectorRequestTitle', {
        defaultMessage: 'Query {refId}',
        values: { refId },
      }),
      {
        description: i18n.translate('explore.embeddable.inspectorRequestDescription', {
          defaultMessage: 'This request queries OpenSearch to fetch the data for the explore.',
        }),
      }
    );
    request?.stats(getRequestInspectorStats(searchSource));
    searchSource.getSearchRequestBody().then((body: Record<string, unknown>) => {
      request?.json(body);
    });

    const languageConfig = services.data.query.queryString
      .getLanguageService()
      .getLanguage(query.language);
    const resp = await searchSource.fetch({
      abortSignal: signal,
      withLongNumeralsSupport: await services.uiSettings.get(UI_SETTINGS.DATA_WITH_LONG_NUMERALS),
      ...(languageConfig?.fields?.formatter ? { formatter: languageConfig.fields.formatter } : {}),
    });
    request?.stats(getResponseInspectorStats(resp, searchSource)).ok({ json: resp });

    const dataFrame = searchSource.getDataFrame();

    return hitsToSeriesResult(
      refId,
      resp.hits.hits,
      dataFrame?.schema ?? [],
      dataFrame?.meta?.seriesDisplayNames as Record<string, string> | undefined
    );
  };

  const outcomes = await Promise.allSettled(rows.map(runRow));
  const series: SeriesResult[] = [];
  const failed: SavedQueriesFetchResult['failed'] = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      if (outcome.value) series.push(outcome.value);
    } else {
      failed.push({ refId: rows[index][0], error: outcome.reason });
    }
  });
  return { series, failed };
};
