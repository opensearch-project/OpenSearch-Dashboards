/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, PreloadedState } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { reducer as styleReducer } from './style_slice';
import { reducer as visualizationReducer } from './visualization_slice';
import { reducer as metadataReducer } from './metadata_slice';
import { reducer as uiStateReducer } from './ui_state_slice';
import { VisBuilderServices } from '../../..';
import { loadReduxState, persistReduxState } from './redux_persistence';
import { handlerEditorState } from './handlers/editor_state';
import { handlerParentAggs } from './handlers/parent_aggs';

const rootReducer = combineReducers({
  ui: uiStateReducer,
  style: styleReducer,
  visualization: visualizationReducer,
  metadata: metadataReducer,
});

export const configurePreloadedStore = (preloadedState: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

export const getPreloadedStore = async (services: VisBuilderServices) => {
  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState);

  let previousState = store.getState();

  // Listen to changes
  const handleChange = () => {
    const state = store.getState();
    persistReduxState(state, services);

    if (isEqual(state, previousState)) return;

    // Side effects to apply after changes to the store are made
    handlerEditorState(store, state, previousState);
    handlerParentAggs(store, state, services);

    previousState = state;
  };

  // the store subscriber will automatically detect changes and call handleChange function
  const unsubscribe = store.subscribe(handleChange);

  return { store, unsubscribe };
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export type RenderState = Omit<RootState, 'metadata'>; // Remaining state after auxillary states are removed
export type Store = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = Store['dispatch'];

export { setState as setStyleState, StyleState } from './style_slice';
export { setState as setVisualizationState, VisualizationState } from './visualization_slice';
export { MetadataState } from './metadata_slice';
export { setState as setUIStateState, UIStateState } from './ui_state_slice';
