/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { combineReducers, configureStore, PreloadedState } from '@reduxjs/toolkit';
import { reducer as dataSourceReducer } from './datasource_slice';
import { reducer as configReducer } from './config_slice';
import { reducer as visualizationReducer } from './visualization_slice';
import { WizardServices } from '../../..';
import { getPreloadedState } from './preload';

const rootReducer = combineReducers({
  dataSource: dataSourceReducer,
  config: configReducer,
  visualization: visualizationReducer,
});

export const configurePreloadedStore = (preloadedState: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

export const getPreloadedStore = async (services: WizardServices) => {
  const preloadedState = await getPreloadedState(services);
  return configurePreloadedStore(preloadedState);
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
type Store = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = Store['dispatch'];
