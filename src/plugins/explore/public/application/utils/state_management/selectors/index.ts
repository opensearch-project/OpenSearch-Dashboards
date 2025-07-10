/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Basic selectors
 */
const selectQueryState = (state: RootState) => state.query;
export const selectUIState = (state: RootState) => state.ui;
const selectResultsState = (state: RootState) => state.results;
const selectLegacyState = (state: RootState) => state.legacy;
export const selectTabState = (state: RootState) => state.tab;

/**
 * Query selectors
 */
export const selectQuery = createSelector([selectQueryState], (queryState) => queryState);

export const selectQueryString = createSelector([selectQueryState], (queryState) =>
  typeof queryState.query === 'string' ? queryState.query : ''
);

export const selectQueryLanguage = createSelector(
  [selectQueryState],
  (queryState) => queryState.language
);

export const selectDataset = createSelector([selectQueryState], (queryState) => queryState.dataset);

/**
 * UI selectors
 */
export const selectActiveTabId = createSelector([selectUIState], (uiState) => uiState.activeTabId);

export const selectQueryPrompt = createSelector([selectUIState], (uiState) => uiState.prompt);

export const selectShowDataSetFields = createSelector(
  [selectUIState],
  (uiState) => uiState.showFilterPanel
);

export const selectShowHistogram = createSelector(
  [selectUIState],
  (uiState) => uiState.showHistogram
);

export const selectStyleOptions = createSelector(
  [selectTabState],
  (tabState) => tabState.visualizations.styleOptions
);

export const selectChartType = createSelector(
  [selectTabState],
  (tabState) => tabState.visualizations.chartType
);

export const selectAxesMapping = createSelector(
  [selectTabState],
  (tabState) => tabState.visualizations.axesMapping
);

export const selectActiveTab = createSelector(
  [selectActiveTabId],
  (activeTabId) => activeTabId // Return just the ID, components will resolve the tab via context
);

/**
 * Results selectors
 */
export const selectResults = createSelector([selectResultsState], (resultsState) => resultsState);

/**
 * Legacy selectors
 */
export const selectColumns = createSelector(
  [selectLegacyState],
  (legacyState) => legacyState.columns
);

export const selectSort = createSelector([selectLegacyState], (legacyState) => legacyState.sort);

export const selectSavedSearch = createSelector(
  [selectLegacyState],
  (legacyState) => legacyState.savedSearch
);

export * from './query_editor';
