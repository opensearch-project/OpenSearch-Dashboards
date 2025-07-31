/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { RootState } from '../store';
import { ExploreServices } from '../../../../types';

/**
 * Middleware to sync Redux dateRange state with global timefilter service
 * This ensures that whenever query execution actions are dispatched, the global
 * timefilter is synchronized with the Redux dateRange state before queries execute.
 */
export const createTimefilterSyncMiddleware = (
  services: ExploreServices
): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    const result = next(action);

    // Only sync timefilter on query execution actions
    if (
      action.type.includes('query/executeQueries') ||
      action.type.includes('query/executeHistogramQuery') ||
      action.type.includes('query/executeTabQuery')
    ) {
      const state = store.getState();
      const dateRange = state.queryEditor.dateRange;

      if (dateRange && services.data?.query?.timefilter?.timefilter) {
        const timefilter = services.data.query.timefilter.timefilter;
        const currentTimefilterRange = timefilter.getTime();

        if (!isEqual(currentTimefilterRange, dateRange)) {
          timefilter.setTime(dateRange);
        }
      }
    }

    return result;
  };
};
