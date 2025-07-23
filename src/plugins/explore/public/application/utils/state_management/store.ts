/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  configureStore,
  combineReducers,
  createAction,
  PreloadedState,
  AnyAction,
  Reducer,
} from '@reduxjs/toolkit';
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
import { createDatasetChangeMiddleware } from './middleware/dataset_change_middleware';
import { ExploreServices } from '../../../types';

const resetState = createAction<RootState>('app/resetState');

const baseRootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  legacy: legacyReducer,
  queryEditor: queryEditorReducer,
});

export const rootReducer: Reducer<RootState, AnyAction> = (state, action) => {
  if (resetState.match(action)) {
    return action.payload;
  }
  return baseRootReducer(state, action);
};

export type RootState = ReturnType<typeof baseRootReducer>;
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
            .concat(createDatasetChangeMiddleware(services))
            .concat(createOverallStatusMiddleware())
        : getDefaultMiddleware(),
  });
};

export const getPreloadedStore = async (services: ExploreServices) => {
  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState, services);
  const initialState = store.getState();
  const reset = () => store.dispatch(resetState(initialState));
  return { store, unsubscribe: () => {}, reset };
};
