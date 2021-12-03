/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore } from '@reduxjs/toolkit';
import { reducer as dataSourceReducer } from './datasource_slice';
import { reducer as configReducer } from './config_slice';

export const store = configureStore({
  reducer: {
    dataSource: dataSourceReducer,
    config: configReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
