/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { setActiveTab } from '../../slices';
import { ExploreServices } from '../../../../../types';
import { defaultPrepareQueryString } from '../query_actions';
import { visualizationRegistry } from '../../../../../components/visualizations/visualization_registry';
import { FIELD_TYPE_MAP } from '../../../../../components/visualizations/constants';
import { VisColumn, VisFieldType } from '../../../../../components/visualizations/types';
import { Query } from '../../../../../../../data/common';
import { QueryExecutionStatus } from '../../types';
import { EXPLORE_LOGS_TAB_ID, EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../../common';

/**
 * Determine if results can be visualized.
 * Classifies columns from fieldSchema only — does not iterate over row data.
 */
const canResultsBeVisualized = (results: any): boolean => {
  if (!results?.hits?.hits || !results?.fieldSchema || results.hits.hits.length === 0) {
    return false;
  }

  const rowCount = results.hits.hits.length;
  const numericalColumns: VisColumn[] = [];
  const categoricalColumns: VisColumn[] = [];
  const dateColumns: VisColumn[] = [];

  results.fieldSchema.forEach((field: { type?: string; name?: string }, index: number) => {
    const schema = FIELD_TYPE_MAP[field.type || ''] || VisFieldType.Unknown;
    const column: VisColumn = {
      id: index,
      schema,
      name: field.name || '',
      column: `field-${index}`,
      // Use rowCount as a conservative upper bound — rules checking uniqueValuesCount
      // thresholds (e.g. >= 7) will pass correctly when there are enough rows.
      validValuesCount: rowCount,
      uniqueValuesCount: rowCount,
    };
    if (schema === VisFieldType.Numerical) numericalColumns.push(column);
    else if (schema === VisFieldType.Categorical) categoricalColumns.push(column);
    else if (schema === VisFieldType.Date) dateColumns.push(column);
  });

  return !!visualizationRegistry.findBestMatch(numericalColumns, categoricalColumns, dateColumns);
};

/**
 * Determine the optimal tab based on results
 * Use visualization tab if we can find a visualization type
 * Otherwise, fallback to logs tab
 */
const determineOptimalTab = (results: any, _services: ExploreServices): string => {
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
      return prepareQuery(queryParam);
    };
  }
  const visualizationTabCacheKey = visualizationTabPrepareQuery(query);

  const visualizationResults = results[visualizationTabCacheKey];
  const visualizationQueryStatus = queryStatusMap[visualizationTabCacheKey];

  let activeTab = '';

  if (visualizationQueryStatus.status === QueryExecutionStatus.ERROR) {
    activeTab = EXPLORE_VISUALIZATION_TAB_ID;
  }

  if (visualizationResults && visualizationResults.hits?.hits?.length > 0) {
    activeTab = determineOptimalTab(visualizationResults, services);
  }
  dispatch(setActiveTab(activeTab));
});

export { canResultsBeVisualized, determineOptimalTab };
