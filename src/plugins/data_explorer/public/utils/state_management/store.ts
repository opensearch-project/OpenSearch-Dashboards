/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, PreloadedState, Reducer, Slice } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { reducer as metadataReducer } from './metadata_slice';
import { loadReduxState, persistReduxState } from './redux_persistence';
import { DataExplorerServices } from '../../types';

const HYDRATE = 'HYDRATE';

export const hydrate = (newState: RootState) => ({
  type: HYDRATE,
  payload: newState,
});

const commonReducers = {
  metadata: metadataReducer,
};

let dynamicReducers: {
  metadata: typeof metadataReducer;
  [key: string]: Reducer;
} = {
  ...commonReducers,
};

const rootReducer = combineReducers(dynamicReducers);

const createRootReducer = (): Reducer<RootState> => {
  const combinedReducer = combineReducers(dynamicReducers);

  return (state: RootState | undefined, action: any): RootState => {
    if (action.type === HYDRATE) {
      return action.payload;
    }
    return combinedReducer(state, action);
  };
};

export const configurePreloadedStore = (preloadedState: PreloadedState<RootState>) => {
  // After registering the slices the root reducer needs to be updated
  const updatedRootReducer = createRootReducer();

  return configureStore({
    reducer: updatedRootReducer,
    preloadedState,
  });
};

export const getPreloadedStore = async (services: DataExplorerServices) => {
  // For each view preload the data and register the slice
  const views = services.viewRegistry.all();
  views.forEach((view) => {
    if (!view.ui) return;

    const { slice } = view.ui;
    registerSlice(slice);
  });

  const preloadedState = await loadReduxState(services);
  const store = configurePreloadedStore(preloadedState);

  let previousState = store.getState();

  // Listen to changes
  const handleChange = () => {
    const state = store.getState();
    persistReduxState(state, services);

    if (isEqual(state, previousState)) return;

    // Add Side effects here to apply after changes to the store are made. None for now.

    previousState = state;
  };

  // the store subscriber will automatically detect changes and call handleChange function
  const unsubscribe = store.subscribe(handleChange);

  // This is necessary because browser navigation updates URL state that isnt reflected in the redux state
  services.scopedHistory.listen(async (location, action) => {
    const urlState = await loadReduxState(services);
    const currentState = store.getState();

    // If the url state is different from the current state, then we need to update the store
    // the state should have a view property if it was loaded from the url
    if (action === 'POP' && urlState.metadata?.view && !isEqual(urlState, currentState)) {
      store.dispatch(hydrate(urlState as RootState));
    }
  });

  const onUnsubscribe = () => {
    dynamicReducers = {
      ...commonReducers,
    };

    unsubscribe();
  };

  return { store, unsubscribe: onUnsubscribe };
};

export const registerSlice = (slice: Slice) => {
  if (dynamicReducers[slice.name]) {
    throw new Error(`Slice ${slice.name} already registered`);
  }
  dynamicReducers[slice.name] = slice.reducer;
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export type RenderState = Omit<RootState, 'metadata'>; // Remaining state after auxillary states are removed
export type Store = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = Store['dispatch'];

export { MetadataState, setIndexPattern, setOriginatingApp } from './metadata_slice';
