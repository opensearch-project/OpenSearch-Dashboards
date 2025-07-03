/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { RootState } from '../store';
import { ExploreServices } from '../../../../types';

/**
 * Middleware to sync Redux query state with global queryStringManager
 * This ensures that whenever query state changes, the global state is updated
 * before any search operations occur. It also manages query history for
 * user-initiated query executions.
 */
export const createQuerySyncMiddleware = (services: ExploreServices): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    const result = next(action);

    if (action.type === 'query/setQueryState' || action.type === 'query/setQueryWithHistory') {
      const state = store.getState();
      const query = state.query;

      if (query.dataset && services.data?.query?.queryString) {
        const queryStringQuery = services.data.query.queryString.getQuery();

        if (!isEqual(queryStringQuery, query)) {
          services.data.query.queryString.setQuery(query);
        }

        // Add to query history only for user-initiated query executions
        // This prevents programmatic updates (loading saved queries, clearing, etc.) from polluting history
        if (action.meta?.addToHistory && query.query?.trim()) {
          const timefilter = services?.data?.query?.timefilter?.timefilter;
          if (timefilter) {
            services.data.query.queryString.addToQueryHistory(query, timefilter.getTime());
          }
        }
      }
    }

    return result;
  };
};
