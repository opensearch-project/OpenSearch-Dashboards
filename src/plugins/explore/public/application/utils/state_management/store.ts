/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore, combineReducers, PreloadedState } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { queryReducer } from './slices/query_slice';
import { uiReducer } from './slices/ui_slice';
import { resultsReducer } from './slices/results_slice';
import { tabReducer } from './slices/tab_slice';
import { legacyReducer } from './slices/legacy_slice';
import { persistReduxState, loadReduxState } from './utils/redux_persistence';
// Note: Query execution is handled by Redux Thunk actions, not store subscriptions
// This follows the design requirement for "Middleware-Driven: Query execution via Redux middleware"

const rootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  legacy: legacyReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

// Timefilter subscriptions are handled in components, not in store
// This follows the design requirement for component-driven timefilter handling

export const configurePreloadedStore = (preloadedState: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

export const getPreloadedStore = async (services: import('../../../types').ExploreServices) => {
  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState);

  let previousState = store.getState();

  const handleChange = () => {
    const state = store.getState();
    persistReduxState(state, services);

    if (isEqual(state, previousState)) return;

    previousState = state;
  };

  const unsubscribe = store.subscribe(handleChange);

  return { store, unsubscribe };
};

export type AppDispatch = ReturnType<typeof configureStore>['dispatch'];
