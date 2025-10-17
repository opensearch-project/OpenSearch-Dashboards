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
export const selectTabLogsState = (state: RootState) => state.tab.logs;

/**
 * Query selectors
 */
export const selectQuery = createSelector([selectQueryState], (queryState) => queryState);

export const selectQueryString = createSelector(
  [selectQueryState],
  (queryState) => queryState.query
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

export const selectShowHistogram = createSelector(
  [selectUIState],
  (uiState) => uiState.showHistogram
);

export const selectPatternsField = createSelector(
  [selectTabState],
  (tabState) => tabState.patterns.patternsField
);

export const selectUsingRegexPatterns = createSelector(
  [selectTabState],
  (tabState) => tabState.patterns.usingRegexPatterns
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
export const selectSavedSearch = createSelector(
  [selectLegacyState],
  (legacyState) => legacyState.savedSearch
);

/**
 * Tab selectors
 */

export const selectTabLogsExpandedRowsMap = createSelector(
  [selectTabLogsState],
  (logsState) => logsState.expandedRowsMap
);

export const selectTabLogsSelectedRowsMap = createSelector(
  [selectTabLogsState],
  (logsState) => logsState.selectedRowsMap
);

export const selectVisibleColumnNames = createSelector(
  [selectTabLogsState],
  (logsState) => logsState.visibleColumnNames
);

export * from './query_editor';
