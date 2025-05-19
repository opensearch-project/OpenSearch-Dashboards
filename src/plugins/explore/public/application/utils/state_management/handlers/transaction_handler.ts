/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Store } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { executeTabQuery } from '../actions/query_actions';

/**
 * Action type for committing a transaction
 */
export const COMMIT_STATE_TRANSACTION = 'transaction/commitState';

/**
 * Action type for restoring state after rollback
 */
export const RESTORE_STATE = 'transaction/restoreState';

/**
 * Handles side effects when transaction state changes
 * This is a regular function that dispatches a thunk
 */
export const handleTransactionChanges = (
  store: Store,
  currentState: RootState,
  previousState: RootState
) => {
  // If transaction just completed, execute queries
  if (previousState.transaction.inProgress && !currentState.transaction.inProgress) {
    // Only execute queries if we're not in an error state
    if (!currentState.transaction.error) {
      // Execute tab query with clearCache option
      // This is dispatching a thunk that will execute the query
      store.dispatch(executeTabQuery({ clearCache: true }) as any);
    }
  }
};
