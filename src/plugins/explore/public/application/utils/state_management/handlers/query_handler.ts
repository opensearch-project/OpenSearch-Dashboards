/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { RootState } from '../store';
import { executeQueries } from '../actions/query_actions';

/**
 * Handles side effects when query state changes
 * This is a regular function that dispatches a thunk
 */
export const handleQueryStateChanges = (
  store: Store,
  currentState: RootState,
  previousState: RootState
) => {
  // Skip if in a transaction - query execution will be handled by transaction handler
  if (currentState.ui.transaction.inProgress) {
    return;
  }

  // Skip if only the query changed but not by user action (e.g., during loading)
  // This prevents unnecessary query execution during initialization
  const isInitialLoad = !previousState.query.query && currentState.query.query;
  if (isInitialLoad && currentState.ui.status !== 'loading') {
    return;
  }

  // If query changed and not in a transaction, execute queries
  if (!isEqual(currentState.query.query, previousState.query.query)) {
    // Execute both tab and histogram queries
    // This is dispatching a thunk that will execute both queries
    store.dispatch(executeQueries() as any);
  }
};

/**
 * Creates a cache key for storing query results
 * Simplified to only include query and time range to avoid key size issues
 */
export const createCacheKey = (query: any, timeRange: any): string => {
  // Just use the query string and time range for the cache key
  // The query string should already include dataset info
  return `${query.query}_${timeRange.from}_${timeRange.to}`;
};
