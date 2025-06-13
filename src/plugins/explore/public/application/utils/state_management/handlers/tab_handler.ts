/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { executeQueries } from '../actions/query_actions';
import { createCacheKey } from './query_handler';
import { ExploreServices } from '../../../../types';

/**
 * Handles side effects when active tab changes
 * This is a regular function that dispatches a thunk
 */
export const handleTabChanges = (
  store: Store,
  services: ExploreServices,
  currentState: RootState,
  previousState: RootState
) => {
  // Skip if in a transaction - tab changes will be handled by transaction handler
  if (currentState.ui.transaction?.inProgress) {
    return;
  }

  const { activeTabId } = currentState.ui;
  const { query } = currentState.query;

  // Get tab definition
  const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);
  if (!tabDefinition) return;

  // Check if we need to execute a query
  // Prepare query for the new tab
  const preparedQuery = tabDefinition.prepareQuery ? tabDefinition.prepareQuery(query) : query;

  // Get current time range
  const timeRange = services.data.query.timefilter.timefilter.getTime();

  // Create cache key
  const cacheKey = createCacheKey(preparedQuery, timeRange);

  // Check if we have cached results
  if (!currentState.results[cacheKey]) {
    // No cached results, execute queries with cache checking
    store.dispatch(executeQueries({ services }) as any);
  }
};
