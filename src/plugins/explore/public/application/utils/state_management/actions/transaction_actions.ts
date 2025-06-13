/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
// Transaction actions now handled in UI slice
// We'll create simple action creators for transaction management
import { startTransaction, commitTransaction, rollbackTransaction } from '../slices/ui_slice';
import { COMMIT_STATE_TRANSACTION, RESTORE_STATE } from '../handlers/transaction_handler';

/**
 * Begins a transaction to batch state updates
 */
export const beginTransaction = () => (dispatch: Dispatch, getState: any) => {
  // Save current state for potential rollback
  const state = getState();
  const previousState = {
    query: { ...state.query },
    ui: { ...state.ui },
    tab: { ...state.tab },
  };

  dispatch(startTransaction({ previousState }));
};

/**
 * Finishes a transaction and triggers query execution
 */
export const finishTransaction = () => (dispatch: Dispatch, getState: any) => {
  const state = getState();

  // Validate transaction state
  if (!state.ui.transaction.inProgress) {
    // Attempting to commit when no transaction is in progress
    return;
  }

  // Mark transaction as complete
  dispatch(commitTransaction());

  // Trigger the actual state commit that handlers listen for
  dispatch({ type: COMMIT_STATE_TRANSACTION });

  // Execute query with clear cache option
  // This will be handled by the transaction handler
  // We don't need to dispatch it here because the handler will do it
};

/**
 * Aborts a transaction and rolls back to previous state
 */
export const abortTransaction = (errorMessage: string) => (dispatch: Dispatch, getState: any) => {
  dispatch(rollbackTransaction(errorMessage));

  // Restore previous state
  const { previousState } = getState().transaction;
  if (previousState) {
    dispatch({ type: RESTORE_STATE, payload: previousState });
  }
};
