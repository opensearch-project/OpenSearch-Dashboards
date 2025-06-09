/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { ResultStatus } from '../../../legacy/discover/application/view_components/utils/use_search';
import { createCacheKey } from '../handlers/query_handler';

/**
 * Basic selectors
 */
const selectQueryState = (state: RootState) => state.query;
const selectUIState = (state: RootState) => state.ui;
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

export const selectExecutionCacheKeys = createSelector(
  [selectUIState],
  (uiState) => uiState?.executionCacheKeys || []
);

export const selectStatus = createSelector([selectUIState], (uiState) => uiState.status);

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

// These selectors are deprecated - use tabRegistry from context instead
// export const selectAllTabs = ...
// export const selectTabsForLanguage = ...

/**
 * Results selectors
 */
// Get the current cache key from executionCacheKeys (which uses real timeRange)
export const selectCurrentCacheKey = createSelector([selectUIState], (uiState) => {
  const executionCacheKeys = uiState?.executionCacheKeys || [];
  return executionCacheKeys.length > 0 ? executionCacheKeys[0] : null;
});

export const selectResults = createSelector(
  [selectResultsState, selectCurrentCacheKey],
  (resultsState, cacheKey) => {
    if (!cacheKey) return null;
    return resultsState[cacheKey];
  }
);

export const selectRows = createSelector([selectResults], (results) => {
  if ((results as any)?.hits?.hits) {
    return (results as any).hits.hits;
  }
  return [];
});

export const selectTotalHits = createSelector([selectResults], (results) => {
  if ((results as any)?.hits?.total?.value !== undefined) {
    return (results as any).hits.total.value;
  }
  return 0;
});

export const selectFieldCounts = createSelector([selectResults], (results) => {
  if ((results as any)?.fieldCounts) {
    return (results as any).fieldCounts;
  }
  return {};
});

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

/**
 * Transaction selectors
 */
export const selectIsTransactionInProgress = createSelector(
  [selectTransactionState],
  (transactionState) => transactionState.inProgress
);

// Transaction error is now handled in UI state
// Transaction error handling moved to toast notifications

/**
 * Combined selectors
 * Note: These selectors are deprecated and should be replaced with context-based access
 */
export const selectTabData = createSelector(
  [selectActiveTabId, selectQuery, selectResults, selectStatus],
  (activeTabId, query, results, status) => {
    // Components should use tabRegistry from context to get tabDefinition
    return {
      tabId: activeTabId,
      query,
      results,
      status,
      preparedQuery: query, // Components should prepare query using tabDefinition from context
    };
  }
);

export const selectIndexPattern = createSelector(
  [selectQueryState],
  (queryState) => queryState.dataset // Components should get indexPattern from context if needed
);
