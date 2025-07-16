/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { persistReduxState } from '../utils/redux_persistence';
import { ExploreServices } from '../../../../types';

/**
 * Persistence middleware that only triggers on specific action types
 * This replaces the store subscription approach for better performance
 */
export const createPersistenceMiddleware = (services: ExploreServices): Middleware => {
  return (store) => (next) => (action) => {
    const result = next(action);

    // Only persist state for actions that should trigger URL updates
    const persistTriggeringActions = ['query/', 'ui/', 'tab/', 'legacy/'];
    const shouldPersist =
      action.type && persistTriggeringActions.some((prefix) => action.type.startsWith(prefix));

    if (shouldPersist) {
      const state = store.getState() as RootState;
      persistReduxState(state, services);
    }

    return result;
  };
};
