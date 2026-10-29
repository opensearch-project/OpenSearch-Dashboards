/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  DEFAULT_COLUMNS_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
} from '../../common';
import { UI_SETTINGS } from '../../../data/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../application/context';
import {
  selectColumns,
  selectHideEmptyFields,
} from '../application/utils/state_management/selectors';
import { filterColumns } from './view_component_utils/filter_columns';
import { getLegacyDisplayedColumns, LegacyDisplayedColumn } from './data_table_helper';
import { ExploreServices } from '../types';
import { RootState } from '../application/utils/state_management/store';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../application/utils/state_management/actions/query_actions';
import { resultsCache } from '../application/utils/state_management/slices';

export interface UseDisplayedColumnsOptions {
  /** Whether to include field counts for column filtering */
  includeFieldCounts?: boolean;
}

/**
 * Drops columns that hold no value in any row of the result set.
 *
 * A column is empty when no returned row populates it. That covers fields the dataset maps but
 * the documents never carry: those keys are absent from `_source` entirely, so they show up in
 * neither count and can only be recognised by their absence from `nonEmptyFieldCounts`.
 *
 * Sparsely populated fields survive — one value anywhere in the result set is enough.
 * With no rows to judge from, every column is kept rather than guessed at.
 */
const filterEmptyColumns = (
  columns: string[],
  dataset: any,
  nonEmptyFieldCounts: Record<string, number>,
  hasRows: boolean
): string[] => {
  if (!hasRows) return columns;

  const remaining = columns.filter(
    (column) =>
      column === '_source' || column === dataset?.timeFieldName || nonEmptyFieldCounts[column] > 0
  );

  // Never hide the whole table: an all-empty result set falls back to the original columns.
  return remaining.length > 0 ? remaining : columns;
};

/**
 * Core function for processing displayed columns with proper filtering.
 * This is the single source of truth for column processing logic.
 */
export const processDisplayedColumns = (
  rawColumns: string[],
  dataset: any,
  uiSettings: any,
  processedResults?: any,
  hideEmptyFields: boolean = false
): LegacyDisplayedColumn[] => {
  if (!dataset) {
    return [];
  }

  // Step 1: Apply filterColumns logic (handles field filtering and _source fallbacks)
  let filteredColumns = filterColumns(
    rawColumns,
    dataset,
    uiSettings.get(DEFAULT_COLUMNS_SETTING),
    uiSettings.get(MODIFY_COLUMNS_ON_SWITCH),
    processedResults?.fieldCounts
  );

  // Step 1.5: Drop columns that are empty across the whole result set
  if (hideEmptyFields && processedResults) {
    filteredColumns = filterEmptyColumns(
      filteredColumns,
      dataset,
      processedResults.nonEmptyFieldCounts ?? {},
      (processedResults.hits?.hits?.length ?? 0) > 0
    );
  }

  // Whether the dataset's time field actually appears in the result set. When we have processed
  // results, trust their field counts: a time-based dataset queried via `source=<lookup>` returns
  // rows without the time field, so it won't appear in fieldCounts. With no processed results
  // (fieldCounts not requested), assume present to preserve legacy behavior.
  const timeFieldName = dataset?.timeFieldName as string | undefined;
  const timeFieldPresent =
    !timeFieldName || !processedResults?.fieldCounts
      ? true
      : (processedResults.fieldCounts[timeFieldName] ?? 0) > 0;

  // Step 2: Handle edge case where only time field remains — but only when the time field is
  // actually in the data. For a lookup query the time field is absent, so this fallback must not
  // fire (it would re-introduce the phantom time column via a lone-timeField assumption).
  if (
    timeFieldPresent &&
    filteredColumns.length === 1 &&
    filteredColumns[0] === dataset?.timeFieldName
  ) {
    filteredColumns = [...filteredColumns, '_source'];
  }

  // Step 3: Apply getLegacyDisplayedColumns logic (handles time field, display names, etc.)
  return getLegacyDisplayedColumns(
    filteredColumns,
    dataset,
    uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
    uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING),
    timeFieldPresent
  );
};

/**
 * Core function for getting displayed column names with proper filtering.
 * This is a convenience function that wraps processDisplayedColumns.
 */
export const processDisplayedColumnNames = (
  rawColumns: string[],
  dataset: any,
  uiSettings: any,
  processedResults?: any,
  hideEmptyFields: boolean = false
): string[] => {
  const displayedColumns = processDisplayedColumns(
    rawColumns,
    dataset,
    uiSettings,
    processedResults,
    hideEmptyFields
  );
  return displayedColumns.map((col) => col.name);
};

/**
 * Shared hook for computing displayed columns with proper filtering.
 * Ensures DataTable and CSV download show identical column sets.
 *
 * This hook applies the same column processing logic that DataTable uses:
 * 1. Apply filterColumns() - validates columns against dataset fields
 * 2. Handle edge case - add _source when only time field remains
 * 3. Apply getLegacyDisplayedColumns() - format for display + add time column
 */
export const useDisplayedColumns = (
  options: UseDisplayedColumnsOptions = {}
): LegacyDisplayedColumn[] => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const columns = useSelector(selectColumns);
  const hideEmptyFields = useSelector(selectHideEmptyFields);
  const { dataset } = useDatasetContext();

  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: RootState) =>
    options.includeFieldCounts ? state.results[cacheKey] : null
  );
  const processedResults = useMemo(() => {
    if (!options.includeFieldCounts || !metadata) return null;
    const rawResults = resultsCache.get(cacheKey);
    return rawResults && dataset ? defaultResultsProcessor(rawResults, dataset) : null;
  }, [options.includeFieldCounts, metadata, cacheKey, dataset]);

  return useMemo(() => {
    return processDisplayedColumns(columns, dataset, uiSettings, processedResults, hideEmptyFields);
  }, [columns, dataset, uiSettings, processedResults, hideEmptyFields]);
};

/**
 * Hook variant that returns just the column names for CSV export.
 * This ensures CSV downloads contain exactly the same columns as DataTable display.
 */
export const useDisplayedColumnNames = (options: UseDisplayedColumnsOptions = {}): string[] => {
  const displayedColumns = useDisplayedColumns(options);

  return useMemo(() => displayedColumns.map((col) => col.name), [displayedColumns]);
};

/**
 * How many of the user's chosen columns the empty-field filter is currently hiding.
 *
 * Counted by re-running the column processing with the setting off and diffing, so the number
 * always matches what the table actually did rather than a separately-derived guess. Returns 0
 * when the setting is off, so callers can treat "nothing hidden" and "not filtering" alike.
 */
export const useHiddenColumnCount = (): number => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings } = services;

  const columns = useSelector(selectColumns);
  const hideEmptyFields = useSelector(selectHideEmptyFields);
  const { dataset } = useDatasetContext();

  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: RootState) => state.results[cacheKey]);
  const processedResults = useMemo(() => {
    if (!metadata) return null;
    const rawResults = resultsCache.get(cacheKey);
    return rawResults && dataset ? defaultResultsProcessor(rawResults, dataset) : null;
  }, [metadata, cacheKey, dataset]);

  return useMemo(() => {
    if (!hideEmptyFields || !processedResults) return 0;

    const shown = processDisplayedColumns(
      columns,
      dataset,
      uiSettings,
      processedResults,
      true
    ).length;
    const all = processDisplayedColumns(
      columns,
      dataset,
      uiSettings,
      processedResults,
      false
    ).length;

    return Math.max(0, all - shown);
  }, [columns, dataset, uiSettings, processedResults, hideEmptyFields]);
};

/**
 * Whether `processedResults` appear to come from somewhere other than `dataset` — the case where a user types `source=<other index>` (e.g. a
 * lookup) while a time-based dataset is selected. Detected the same way the Time column drop is:
 * the dataset declares a time field, but it's absent from the returned rows' field counts.
 *
 * Returns false when there's nothing to judge from (no results yet, or a dataset with no time
 * field), so callers can treat it as "querying within the dataset" by default.
 */
export const isQueryingOutsideDatasetResult = (dataset: any, processedResults: any): boolean => {
  const timeFieldName = dataset?.timeFieldName as string | undefined;
  // Need a time-based dataset and a populated result set to make the call.
  if (!timeFieldName || !processedResults?.fieldCounts) return false;
  const hasRows = (processedResults.hits?.hits?.length ?? 0) > 0;
  if (!hasRows) return false;
  // Dataset has a time field, results have rows, but none carry that time field → the rows came
  // from a different source than the dataset.
  return (processedResults.fieldCounts[timeFieldName] ?? 0) === 0;
};

/**
 * Pure form of {@link useIsNonTimeSeries}: whether the current view is non-time-series, i.e. the
 * time-based features (Logs/Visualization/Patterns tabs, histogram, Time column) have no
 * timestamp to work with. True when either:
 *  - the selected dataset declares no time field at all (e.g. a lookup index pattern picked
 *    directly in the dataset selector), or
 *  - a time-based dataset is being queried outside itself ({@link isQueryingOutsideDatasetResult}).
 *
 * The no-time-field case is decided from the dataset alone and applies immediately on selection,
 * without waiting for results: the answer can't change once rows arrive, and waiting would make
 * the tab bar flash the time-series set (Logs etc.) before swapping. The outside-dataset case is
 * only knowable from returned rows, so it still requires populated results.
 *
 * False with no dataset selected — nothing to judge from, so default to the time-series flow.
 */
export const isNonTimeSeriesResult = (dataset: any, processedResults: any): boolean => {
  if (!dataset) return false;
  if (!dataset.timeFieldName) return true;
  return isQueryingOutsideDatasetResult(dataset, processedResults);
};

/**
 * Processed results for the current query's default cache key, or null before any have arrived.
 * Shared by the dataset/result-shape detection hooks below.
 */
const useCurrentProcessedResults = (dataset: any) => {
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: RootState) => state.results[cacheKey]);
  return useMemo(() => {
    if (!metadata) return null;
    const rawResults = resultsCache.get(cacheKey);
    return rawResults && dataset ? defaultResultsProcessor(rawResults, dataset) : null;
  }, [metadata, cacheKey, dataset]);
};

/**
 * Whether Explore should be in non-time-series mode (single Query Results tab + notice). See
 * {@link isNonTimeSeriesResult} for the conditions.
 */
export const useIsNonTimeSeries = (): boolean => {
  const { dataset } = useDatasetContext();
  const processedResults = useCurrentProcessedResults(dataset);
  return useMemo(
    () => isNonTimeSeriesResult(dataset, processedResults),
    [dataset, processedResults]
  );
};
