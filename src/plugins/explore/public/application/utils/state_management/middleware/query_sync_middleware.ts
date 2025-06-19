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
 * before any search operations occur.
 */
export const createQuerySyncMiddleware = (services: ExploreServices): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    // Let the action go through first
    const result = next(action);

    // Check if this action affects query state
    if (action.type === 'query/setQuery') {
      const state = store.getState();
      const query = state.query;

      if (query.dataset && services.data?.query?.queryString) {
        const queryStringQuery = services.data.query.queryString.getQuery();

        if (!isEqual(queryStringQuery, query)) {
          services.data.query.queryString.setQuery(query);
        }
      }
    }

    return result;
  };
};
