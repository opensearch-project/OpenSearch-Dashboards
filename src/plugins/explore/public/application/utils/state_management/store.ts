/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore, combineReducers, PreloadedState } from '@reduxjs/toolkit';
import {
  queryReducer,
  uiReducer,
  resultsReducer,
  tabReducer,
  legacyReducer,
  systemReducer,
} from './slices';
import { loadReduxState } from './utils/redux_persistence';
import { createQuerySyncMiddleware } from './middleware/query_sync_middleware';
import { createPersistenceMiddleware } from './middleware/persistence_middleware';
import { ExploreServices } from '../../../types';

const rootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  legacy: legacyReducer,
  system: systemReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = AppStore['dispatch'];

export const configurePreloadedStore = (
  preloadedState: PreloadedState<RootState>,
  services?: ExploreServices
) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      services
        ? getDefaultMiddleware()
            .concat(createPersistenceMiddleware(services))
            .concat(createQuerySyncMiddleware(services))
        : getDefaultMiddleware(),
  });
};

export const getPreloadedStore = async (services: ExploreServices) => {
  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState, services);
  return { store, unsubscribe: () => {} };
};
