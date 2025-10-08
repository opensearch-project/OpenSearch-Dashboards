/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { QueryExecutionStatus, QueryResultStatus } from '../types';
import { QueryStatusMap, setOverallQueryStatus, setHasUserInitiatedQuery } from '../slices/query_editor/query_editor_slice';

/**
 * Middleware that automatically computes overall status from individual query statuses
 */
export const createOverallStatusMiddleware = (): Middleware => {
  return (store) => (next) => (action) => {
    const result = next(action);

    // Only recompute when individual status changes
    if (action.type === 'queryEditor/setIndividualQueryStatus') {
      const state = store.getState() as RootState;
      const currentOverallStatus = state.queryEditor.overallQueryStatus;

      if (currentOverallStatus.status === QueryExecutionStatus.ERROR) {
        return result;
      }

      const incomingStatus = action.payload.status;

      // If incoming status is ERROR, set it as overall status
      if (incomingStatus.status === QueryExecutionStatus.ERROR) {
        store.dispatch(setOverallQueryStatus(incomingStatus));
        store.dispatch(setHasUserInitiatedQuery(false));
        return result;
      }

      // Otherwise, compute overall status from the status map
      const statusMap = state.queryEditor.queryStatusMap;
      const newOverallStatus = computeOverallStatus(statusMap);
      store.dispatch(setOverallQueryStatus(newOverallStatus));

      // Reset hasUserInitiatedQuery flag when queries complete (READY, NO_RESULTS, or ERROR)
      if (newOverallStatus.status !== QueryExecutionStatus.LOADING &&
          newOverallStatus.status !== QueryExecutionStatus.UNINITIALIZED) {
        store.dispatch(setHasUserInitiatedQuery(false));
      }
    }

    return result;
  };
};

/**
 * Compute overall status from individual query statuses
 */
const computeOverallStatus = (statusMap: QueryStatusMap): QueryResultStatus => {
  const statuses = Object.values(statusMap);

  if (statuses.length === 0) {
    return {
      status: QueryExecutionStatus.UNINITIALIZED,
      elapsedMs: undefined,
      startTime: undefined,
      error: undefined,
    };
  }

  const loadingStatuses = statuses.filter((s) => s.status === QueryExecutionStatus.LOADING);
  if (loadingStatuses.length > 0) {
    const earliestStartTime = Math.min(
      ...(loadingStatuses.map((s) => s.startTime).filter((t) => t !== undefined) as number[])
    );

    return {
      status: QueryExecutionStatus.LOADING,
      startTime: earliestStartTime || Date.now(),
      elapsedMs: undefined,
      error: undefined,
    };
  }

  // All completed (use slowest query's timing and body)
  const readyStatuses = statuses.filter((s) => s.status === QueryExecutionStatus.READY);
  const noResultsStatuses = statuses.filter((s) => s.status === QueryExecutionStatus.NO_RESULTS);
  const completedStatuses = [...readyStatuses, ...noResultsStatuses];

  if (completedStatuses.length === statuses.length) {
    const slowestQuery = completedStatuses.reduce((slowest, current) => {
      if (!slowest.elapsedMs || !current.elapsedMs) return slowest;
      return current.elapsedMs > slowest.elapsedMs ? current : slowest;
    });

    const overallStatus =
      readyStatuses.length > 0 ? QueryExecutionStatus.READY : QueryExecutionStatus.NO_RESULTS;

    return {
      status: overallStatus,
      startTime: slowestQuery.startTime,
      elapsedMs: slowestQuery.elapsedMs,
      error: slowestQuery.error,
    };
  }

  return statuses[0];
};
