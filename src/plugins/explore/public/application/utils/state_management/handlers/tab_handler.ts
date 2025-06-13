/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { executeTabQuery } from '../actions/query_actions';
import { createTabCacheKey } from '../actions/query_actions';

/**
 * Handles side effects when active tab changes
 * This is a regular function that dispatches a thunk
 */
export const handleTabChanges = (
  store: Store,
  currentState: RootState,
  previousState: RootState
) => {
  // Skip if in a transaction - tab changes will be handled by transaction handler
  if (currentState.transaction.inProgress) {
    return;
  }

  const { activeTabId } = currentState.ui;
  const { query } = currentState.query;
  const services = currentState.services;

  // Get tab definition
  const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);
  if (!tabDefinition) return;

  // Call onActive hook if defined
  if (tabDefinition.onActive) {
    tabDefinition.onActive();
  }

  // Call onInactive hook for previous tab if defined
  const previousTabId = previousState.ui.activeTabId;
  const previousTabDefinition = services.tabRegistry?.getTab?.(previousTabId);
  if (previousTabDefinition?.onInactive) {
    previousTabDefinition.onInactive();
  }

  // Check if we need to execute a query
  // Prepare query for the new tab
  const preparedQuery = tabDefinition.prepareQuery ? tabDefinition.prepareQuery(query) : query;

  // Get current time range
  const timeRange = services.data.query.timefilter.timefilter.getTime();

  // Create cache key
  const cacheKey = createTabCacheKey(preparedQuery, timeRange);

  // Check if we have cached results
  if (!currentState.results[cacheKey]) {
    // No cached results, execute tab query only (not histogram)
    // This is dispatching a thunk that will execute only the tab query
    store.dispatch(executeTabQuery() as any);
  }
};
