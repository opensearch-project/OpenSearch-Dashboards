/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReduxStoreAdapter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

// Create a Redux slice for counter state
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 } as CounterState,
  reducers: {
    updateState: (state, action: PayloadAction<CounterState>) => {
      return action.payload;
    },
  },
});

// Create the Redux store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

// Create a Redux adapter that can be used with our BaseActions and BaseSelectors
export const createReduxCounterAdapter = () => {
  return new ReduxStoreAdapter<CounterState, ReturnType<typeof store.getState>>(
    store,
    (state) => state.counter,
    (updater) => counterSlice.actions.updateState(updater(store.getState().counter))
  );
};

// Export the store for direct usage if needed
export { store as reduxCounterStore };
