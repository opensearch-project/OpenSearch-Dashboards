/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { QueryExecutionStatus, QueryResultStatus } from '../types';
import {
  QueryStatusMap,
  setOverallQueryStatus,
  setHasUserInitiatedQuery,
} from '../slices/query_editor/query_editor_slice';

/**
 * Middleware that automatically computes overall status from individual query statuses
 */
export const createOverallStatusMiddleware = (): Middleware => {
  return (store) => (next) => (action) => {
    const result = next(action);

    // Only recompute when an individual status changes or is removed
    if (
      action.type === 'queryEditor/setIndividualQueryStatus' ||
      action.type === 'queryEditor/clearQueryStatusMapByKey'
    ) {
      const state = store.getState() as RootState;
      const currentOverallStatus = state.queryEditor.overallQueryStatus;
      const statusMap = state.queryEditor.queryStatusMap;

      // The user's run is over once nothing is in flight. A failed query doesn't end it while the
      // others are still running, so Stop stays available until they settle.
      const clearUserInitiatedOnceSettled = () => {
        const isAnyQueryLoading = Object.values(statusMap).some(
          (s) => s?.status === QueryExecutionStatus.LOADING
        );
        if (!isAnyQueryLoading && state.queryEditor.hasUserInitiatedQuery) {
          store.dispatch(setHasUserInitiatedQuery(false));
        }
      };

      if (currentOverallStatus.status === QueryExecutionStatus.ERROR) {
        clearUserInitiatedOnceSettled();
        return result;
      }

      // If incoming status is ERROR, set it as overall status
      const incomingStatus =
        action.type === 'queryEditor/setIndividualQueryStatus' ? action.payload.status : undefined;
      if (incomingStatus?.status === QueryExecutionStatus.ERROR) {
        store.dispatch(setOverallQueryStatus(incomingStatus));
        clearUserInitiatedOnceSettled();
        return result;
      }

      // Otherwise, compute overall status from the status map
      const newOverallStatus = computeOverallStatus(statusMap);
      store.dispatch(setOverallQueryStatus(newOverallStatus));

      clearUserInitiatedOnceSettled();
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
      // Carried so consumers can distinguish "nothing to show yet" from "in flight with partial
      // results already rendered".
      streaming: loadingStatuses.find((s) => s.streaming)?.streaming,
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
