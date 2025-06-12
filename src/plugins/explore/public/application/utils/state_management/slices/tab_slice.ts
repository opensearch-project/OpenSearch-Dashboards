/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TabState {
  [tabId: string]: {
    skipInitialFetch?: boolean;
  };
}

const initialState: TabState = {
  logs: {
    skipInitialFetch: false,
  },
  visualizations: {
    skipInitialFetch: false,
  },
};

const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setTabState: (
      state,
      action: PayloadAction<{ tabId: string; state: { skipInitialFetch?: boolean } }>
    ) => {
      const { tabId, state: tabState } = action.payload;
      state[tabId] = { ...state[tabId], ...tabState };
    },
    setSkipInitialFetch: (state, action: PayloadAction<{ tabId: string; skip: boolean }>) => {
      const { tabId, skip } = action.payload;
      if (state[tabId]) {
        state[tabId].skipInitialFetch = skip;
      }
    },
  },
});

export const { setTabState, setSkipInitialFetch } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
