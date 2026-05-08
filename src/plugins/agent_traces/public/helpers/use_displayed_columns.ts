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
import { selectColumns } from '../application/utils/state_management/selectors';
import { filterColumns } from './view_component_utils/filter_columns';
import { getLegacyDisplayedColumns, LegacyDisplayedColumn } from './data_table_helper';
import { AgentTracesServices } from '../types';
import { RootState } from '../application/utils/state_management/store';
import {
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from '../application/utils/state_management/actions/query_actions';

export interface UseDisplayedColumnsOptions {
  /** Whether to include field counts for column filtering */
  includeFieldCounts?: boolean;
}

const processDisplayedColumns = (
  rawColumns: string[],
  dataset: any,
  uiSettings: any,
  processedResults?: any
): LegacyDisplayedColumn[] => {
  if (!dataset) {
    return [];
  }

  let filteredColumns = filterColumns(
    rawColumns,
    dataset,
    uiSettings.get(DEFAULT_COLUMNS_SETTING),
    uiSettings.get(MODIFY_COLUMNS_ON_SWITCH),
    processedResults?.fieldCounts
  );

  // Add _source fallback when only the time field remains
  if (filteredColumns.length === 1 && filteredColumns[0] === dataset?.timeFieldName) {
    filteredColumns = [...filteredColumns, '_source'];
  }

  return getLegacyDisplayedColumns(
    filteredColumns,
    dataset,
    uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
    uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING)
  );
};

export const processDisplayedColumnNames = (
  rawColumns: string[],
  dataset: any,
  uiSettings: any,
  processedResults?: any
): string[] => {
  const displayedColumns = processDisplayedColumns(
    rawColumns,
    dataset,
    uiSettings,
    processedResults
  );
  return displayedColumns.map((col) => col.name);
};

/**
 * Shared hook for computing displayed columns.
 * Ensures DataTable and CSV download show identical column sets.
 */
export const useDisplayedColumns = (
  options: UseDisplayedColumnsOptions = {}
): LegacyDisplayedColumn[] => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { uiSettings } = services;

  const columns = useSelector(selectColumns);
  const { dataset } = useDatasetContext();

  // Get processed results for field counts if needed
  const processedResults = useSelector((state: RootState) => {
    if (!options.includeFieldCounts) return null;
    const query = state.query;
    const cacheKey = defaultPrepareQueryString(query);
    const rawResults = state.results[cacheKey];
    return rawResults && dataset ? defaultResultsProcessor(rawResults, dataset) : null;
  });

  return useMemo(() => {
    return processDisplayedColumns(columns, dataset, uiSettings, processedResults);
  }, [columns, dataset, uiSettings, processedResults]);
};

export const useDisplayedColumnNames = (options: UseDisplayedColumnsOptions = {}): string[] => {
  const displayedColumns = useDisplayedColumns(options);

  return useMemo(() => displayedColumns.map((col) => col.name), [displayedColumns]);
};
