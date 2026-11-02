/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { has } from 'lodash';
import {
  DEFAULT_COLUMNS_SETTING,
  DOC_HIDE_TIME_COLUMN_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
} from '../../common';
import { UI_SETTINGS } from '../../../data/public';
import {
  getPPLSourceTimeFieldChecker,
  PPLSourceCheckDataset,
  pplSourceDiffersFromDataset,
} from '../../../data/common';
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
 * Whether a search hit carries `field`, in `_source` (flat dotted key or nested path) or `fields`.
 * Presence of the key is what counts, not its value: schema-driven results (PPL) put every schema
 * column on every row, so a null time value still means the queried source has the field.
 */
export const hitCarriesField = (hit: any, field: string): boolean =>
  has(hit?._source, field) || has(hit?.fields, field);

export interface NonTimeSeriesInputs {
  /** The selected dataset (from the dataset context). */
  dataset: any;
  /**
   * The PPL query string as sent to the search interceptor, or undefined for other languages
   * (only PPL can name a `source=` other than the dataset).
   */
  queryString?: string;
  /**
   * The shared {@link PPLSourceTimeFieldChecker} verdict for `queryString`: whether its source lacks
   * the dataset's time field. Undefined while the check is pending.
   */
  sourceLacksTimeField?: boolean;
  /** Whether returned rows lack the time field; undefined with no rows to judge from. */
  hitsLackTimeField?: boolean;
}

/**
 * Pure form of {@link useIsNonTimeSeries}: whether the current view is non-time-series, i.e. the
 * time-based features (Logs/Patterns tabs, histogram, Time column) have no timestamp to work with.
 * True when either:
 *  - the selected dataset declares no time field at all (e.g. a lookup index pattern picked
 *    directly in the dataset selector), or
 *  - a PPL query's `source=` names something the dataset title doesn't cover AND that source
 *    lacks the dataset's time field (e.g. `source=<lookup>` over a time-based dataset).
 *
 * The second case is the same decision the PPL search interceptor uses to skip the date picker
 * filter (`PPLSourceTimeFieldChecker` in data/common), so the badge appears exactly when the time
 * filter was skipped. A query over the dataset itself never qualifies, however its rows look:
 * `| fields host`, `| table host`, `| fields - @timestamp` or `| stats ...` all drop the time
 * field from the rows while still being filtered by the date picker.
 *
 * The no-time-field case is decided from the dataset alone and applies immediately on selection,
 * without waiting for results, so the tab bar doesn't flash the time-series set before swapping.
 * While the source check is still pending, the returned rows stand in for it.
 *
 * False with no dataset selected — nothing to judge from, so default to the time-series flow.
 */
export const isNonTimeSeriesResult = ({
  dataset,
  queryString,
  sourceLacksTimeField,
  hitsLackTimeField,
}: NonTimeSeriesInputs): boolean => {
  if (!dataset) return false;
  if (!dataset.timeFieldName) return true;
  if (!queryString || !pplSourceDiffersFromDataset(queryString, dataset.title)) return false;
  if (sourceLacksTimeField !== undefined) return sourceLacksTimeField;
  return hitsLackTimeField ?? false;
};

/**
 * Whether Explore should be in non-time-series mode (Logs/Patterns tabs hidden + notice). See
 * {@link isNonTimeSeriesResult} for the conditions.
 *
 * Reads the raw cached hits directly rather than running the results processor: this hook has
 * several consumers per render, and the processor flattens every hit and has side effects.
 */
export const useIsNonTimeSeries = (): boolean => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const query = useSelector((state: RootState) => state.query);
  const cacheKey = useMemo(() => defaultPrepareQueryString(query), [query]);
  const metadata = useSelector((state: RootState) => state.results[cacheKey]);

  const timeFieldName = dataset?.timeFieldName as string | undefined;
  // The interceptor sees the prepared query (with `source=` filled in), so check the same string.
  const queryString = query?.language === 'PPL' ? cacheKey : undefined;
  const sourceDiffers =
    !!timeFieldName && !!queryString && pplSourceDiffersFromDataset(queryString, dataset?.title);

  // What the interceptor checks against: the query's own dataset (title, time field, data source).
  const checkDataset = useMemo<PPLSourceCheckDataset | undefined>(
    () =>
      query?.dataset ?? {
        title: dataset?.title,
        timeFieldName,
        dataSource: { id: dataset?.dataSourceRef?.id },
      },
    [query?.dataset, dataset?.title, dataset?.dataSourceRef?.id, timeFieldName]
  );

  const indexPatterns = services?.data?.indexPatterns;
  const checker = useMemo(
    () => (indexPatterns ? getPPLSourceTimeFieldChecker(indexPatterns) : undefined),
    [indexPatterns]
  );

  // Usually already answered: the interceptor ran the same check before the query was sent.
  const peeked =
    sourceDiffers && checker && queryString ? checker.peek(queryString, checkDataset) : undefined;
  const [fetched, setFetched] = useState<{ queryString: string; value: boolean } | undefined>();

  useEffect(() => {
    if (!sourceDiffers || !checker || !queryString || peeked !== undefined) return;
    let cancelled = false;
    checker.sourceLacksTimeField(queryString, checkDataset).then((value) => {
      if (!cancelled) setFetched({ queryString, value });
    });
    return () => {
      cancelled = true;
    };
  }, [sourceDiffers, checker, queryString, checkDataset, peeked]);

  const sourceLacksTimeField =
    peeked ?? (fetched && fetched.queryString === queryString ? fetched.value : undefined);

  // Provisional answer while the check is pending. Only computed when it can matter; stops at the
  // first row carrying the time field.
  const needsHits = sourceDiffers && sourceLacksTimeField === undefined;
  const hitsLackTimeField = useMemo(() => {
    if (!needsHits || !metadata || !timeFieldName) return undefined;
    const hits = resultsCache.get(cacheKey)?.hits?.hits;
    if (!hits?.length) return undefined;
    return !hits.some((hit: any) => hitCarriesField(hit, timeFieldName));
  }, [needsHits, metadata, cacheKey, timeFieldName]);

  return isNonTimeSeriesResult({ dataset, queryString, sourceLacksTimeField, hitsLackTimeField });
};
