/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { setActiveTab } from '../../slices';
import { ExploreServices } from '../../../../../types';
import { defaultPrepareQueryString } from '../query_actions';
import { normalizeResultRows } from '../../../../../components/visualizations/utils/normalize_result_rows';
import { visualizationRegistry } from '../../../../../components/visualizations/visualization_registry';
import { getQueryWithSource } from '../../../languages';
import { Query } from '../../../../../../../data/common';
import { QueryExecutionStatus } from '../../types';
import { EXPLORE_LOGS_TAB_ID, EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../../common';

/**
 * Determine if results can be visualized
 */
const canResultsBeVisualized = (results: any): boolean => {
  if (!results?.hits?.hits || !results?.fieldSchema || results.hits.hits.length === 0) {
    return false;
  }

  const rows = results.hits.hits;
  const fieldSchema = results.fieldSchema;
  const { numericalColumns, categoricalColumns, dateColumns } = normalizeResultRows(
    rows,
    fieldSchema
  );
  const matchedRule = visualizationRegistry.findBestMatch(
    numericalColumns,
    categoricalColumns,
    dateColumns
  );

  return !!matchedRule;
};

/**
 * Determine the optimal tab based on results
 * Use visualization tab if we can find a visualization type
 * Otherwise, fallback to logs tab
 */
const determineOptimalTab = (results: any, services: ExploreServices): string => {
  if (canResultsBeVisualized(results)) {
    return EXPLORE_VISUALIZATION_TAB_ID || EXPLORE_LOGS_TAB_ID;
  }
  // TODO: Add more logic to determine optimal tab based on results
  // TODO: Check if there is a query with stats but can't visualize it
  return EXPLORE_LOGS_TAB_ID;
};

/**
 * Detect the optimal tab based on results and sets it as active.
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: ExploreServices; savedTabId?: string },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async ({ services }, { getState, dispatch }) => {
  const state = getState();
  const query = state.query;
  const results = state.results;
  const queryStatusMap = state.queryEditor.queryStatusMap;

  // Get results for visualization tab
  const visualizationTab = services.tabRegistry.getTab('explore_visualization_tab');
  let visualizationTabPrepareQuery = defaultPrepareQueryString;
  if (visualizationTab?.prepareQuery) {
    const prepareQuery = visualizationTab.prepareQuery;
    visualizationTabPrepareQuery = (queryParam: Query): string => {
      return prepareQuery(getQueryWithSource(queryParam));
    };
  }
  const visualizationTabCacheKey = visualizationTabPrepareQuery(query);

  const visualizationResults = results[visualizationTabCacheKey];
  const visualizationQueryStatus = queryStatusMap[visualizationTabCacheKey];

  if (visualizationQueryStatus.status === QueryExecutionStatus.ERROR) {
    dispatch(setActiveTab(EXPLORE_VISUALIZATION_TAB_ID));
  }

  if (visualizationResults && visualizationResults.hits?.hits?.length > 0) {
    const optimalTab = determineOptimalTab(visualizationResults, services);
    dispatch(setActiveTab(optimalTab));
  }
});

export { canResultsBeVisualized, determineOptimalTab };
