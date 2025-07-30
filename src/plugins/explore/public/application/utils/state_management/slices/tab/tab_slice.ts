/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TabState {
  logs: {};
}

const initialState: TabState = {
  logs: {},
};

const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setTabState: (_, action: PayloadAction<TabState>) => {
      return { ...action.payload };
    },
  },
});

export const { setTabState } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
