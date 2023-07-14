/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, PreloadedState } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { reducer as metadataReducer } from './metadata_slice';
import { loadReduxState, persistReduxState } from './redux_persistence';
import { DataExplorerServices } from '../../types';

const rootReducer = combineReducers({
  metadata: metadataReducer,
});

export const configurePreloadedStore = (preloadedState: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

export const getPreloadedStore = async (services: DataExplorerServices) => {
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

  return { store, unsubscribe };
};

// export const registerSlice = (slice: any) => {
//   dynamicReducers[slice.name] = slice.reducer;
//   store.replaceReducer(combineReducers(dynamicReducers));

//   // Extend RootState to include the new slice
//   declare module 'path-to-main-store' {
//     interface RootState {
//       [slice.name]: ReturnType<typeof slice.reducer>;
//     }
//   }
// }

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export type RenderState = Omit<RootState, 'metadata'>; // Remaining state after auxillary states are removed
export type Store = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = Store['dispatch'];

export { MetadataState, setIndexPattern, setOriginatingApp } from './metadata_slice';
