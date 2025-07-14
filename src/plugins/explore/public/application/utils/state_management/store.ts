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
  queryEditorReducer,
} from './slices';
import { loadReduxState } from './utils/redux_persistence';
import { createQuerySyncMiddleware } from './middleware/query_sync_middleware';
import { createPersistenceMiddleware } from './middleware/persistence_middleware';
import { createOverallStatusMiddleware } from './middleware/overall_status_middleware';
import { resetExploreStateActionCreator } from './actions/reset_explore_state/reset_explore_state';
import { ExploreServices } from '../../../types';

export const rootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  legacy: legacyReducer,
  queryEditor: queryEditorReducer,
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
            .concat(createOverallStatusMiddleware())
        : getDefaultMiddleware(),
  });
};

export const getPreloadedStore = async (services: ExploreServices) => {
  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState, services);
  const reset = () => {
    store.dispatch(resetExploreStateActionCreator(services));
  };
  return { store, unsubscribe: () => {}, reset };
};
