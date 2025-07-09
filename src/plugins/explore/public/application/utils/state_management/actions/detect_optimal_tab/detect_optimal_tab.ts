/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { setActiveTab } from '../../slices';
import { ExploreServices } from '../../../../../types';
import { defaultPrepareQueryString } from '../query_actions';
import { getVisualizationType } from '../../../../../components/visualizations/utils/use_visualization_types';

/**
 * Determine if results can be visualized
 */
const canResultsBeVisualized = (results: any): boolean => {
  if (!results?.hits?.hits || !results?.fieldSchema || results.hits.hits.length === 0) {
    return false;
  }

  const rows = results.hits.hits;
  const fieldSchema = results.fieldSchema;
  const visualizationData = getVisualizationType(rows, fieldSchema);

  return !!visualizationData?.visualizationType;
};

/**
 * Determine the optimal tab based on results
 * Use visualization tab if we can find a visualization type
 * Otherwise, fallback to logs tab
 */
const determineOptimalTab = (results: any): string => {
  if (canResultsBeVisualized(results)) {
    return 'explore_visualization_tab';
  }
  // TODO: Add more logic to determine optimal tab based on results
  return 'logs';
};

/**
 * Detect the optimal tab based on results and sets it as active.
 * @param savedTabId - Optional tab ID from saved explore (when provided, skips detection)
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: ExploreServices; savedTabId?: string },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async ({ services, savedTabId }, { getState, dispatch }) => {
  const state = getState();
  if (savedTabId) {
    dispatch(setActiveTab(savedTabId));
    return;
  }

  const query = state.query;
  const results = state.results;

  // Get results for visualization tab
  const visualizationTab = services.tabRegistry?.getTab('explore_visualization_tab');
  const visualizationTabPrepareQuery = visualizationTab?.prepareQuery || defaultPrepareQueryString;
  const visualizationTabCacheKey = visualizationTabPrepareQuery(query);

  const visualizationResults = results[visualizationTabCacheKey];

  if (visualizationResults && visualizationResults.hits?.hits?.length > 0) {
    const optimalTab = determineOptimalTab(visualizationResults);
    dispatch(setActiveTab(optimalTab));
  }
});

export { canResultsBeVisualized, determineOptimalTab };
