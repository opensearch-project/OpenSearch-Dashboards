/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, PreloadedState } from '@reduxjs/toolkit';
import { reducer as styleReducer } from './style_slice';
import { reducer as visualizationReducer } from './visualization_slice';
import { reducer as metadataReducer } from './metadata_slice';
import { WizardServices } from '../../..';
import { getPreloadedState } from './preload';
import { setEditorState } from './metadata_slice';

const rootReducer = combineReducers({
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

export const getPreloadedStore = async (services: WizardServices) => {
  const preloadedState = await getPreloadedState(services);
  const store = configurePreloadedStore(preloadedState);

  let previousStore = {
    vizState: store.getState().visualization,
    styleState: store.getState().style,
  };

  let previousMetadata = store.getState().metadata;

  // Listen to changes
  const handleChange = () => {
    const currentStore = {
      vizState: store.getState().visualization,
      styleState: store.getState().style,
    };

    const metaState = store.getState().metadata;

    // Need to make sure the editorStates are in the clean states(not the initial states) to indicate the viz finished loading
    // Because when loading a saved viz from saved object, the previousStore will differ from
    // the currentStore even tho there is no changes applied ( aggParams will
    // first be empty, and it then will change to not empty once the viz finished loading)
    if (
      metaState.editorState.state === 'clean' &&
      JSON.stringify(currentStore) !== JSON.stringify(previousStore) &&
      previousMetadata.editorState.state === 'clean'
    ) {
      store.dispatch(setEditorState({ state: 'dirty' }));
    }

    previousStore = currentStore;
    previousMetadata = metaState;
  };

  // the store subscriber will automatically detect changes and call handleChange funtion
  const unsubscribe = store.subscribe(handleChange);

  return store;
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
type Store = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = Store['dispatch'];

export { setState as setStyleState, StyleState } from './style_slice';
export { setState as setVisualizationState, VisualizationState } from './visualization_slice';
