/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MetaState {
  isInitialized: boolean;
}

const initialState: MetaState = {
  isInitialized: false,
};

export const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    setIsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setIsInitialized } = metaSlice.actions;
export const metaReducer = metaSlice.reducer;
