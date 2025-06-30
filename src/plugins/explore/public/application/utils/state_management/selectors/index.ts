/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { ResultStatus } from '../../../legacy/discover/application/view_components/utils/use_search';

/**
 * Basic selectors
 */
const selectQueryState = (state: RootState) => state.query;
export const selectUIState = (state: RootState) => state.ui;
const selectResultsState = (state: RootState) => state.results;
const selectLegacyState = (state: RootState) => state.legacy;
const selectTransactionState = (state: RootState) => state.ui.transaction;

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

export const selectStatus = createSelector([selectUIState], (uiState) => uiState.status);
export const selectShowDataSetFields = createSelector(
  [selectUIState],
  (uiState) => uiState.showDatasetFields
);

export const selectStyleOptions = createSelector(
  [selectUIState],
  (uiState) => uiState.styleOptions
);

export const selectChartType = createSelector([selectUIState], (uiState) => uiState.chartType);

// Backward compatibility selector for components that still check isLoading
export const selectIsLoading = createSelector(
  [selectUIState],
  (uiState) => uiState.status === ResultStatus.LOADING
);

// Error handling moved to toast notifications and search service

export const selectFlavor = createSelector([selectUIState], (uiState) => uiState.flavor);

// TODO: Fix this selector - queryPanel doesn't exist in UIState
// export const selectPromptQuery = createSelector(
//   [selectUIState],
//   (uiState) => uiState.queryPanel.promptQuery
// );

/**
 * Tab selectors
 * Note: These selectors now need to be used with services from context
 * Components should use useOpenSearchDashboards<ExploreServices>() to get tabRegistry
 */
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

export const selectSavedQuery = createSelector(
  [selectLegacyState],
  (legacyState) => legacyState.savedQuery
);

/**
 * Transaction selectors
 */
export const selectIsTransactionInProgress = createSelector(
  [selectTransactionState],
  (transactionState) => transactionState.inProgress
);
