/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResultStatus } from '../../types';

export interface SystemState {
  status: ResultStatus;
}

const initialState: SystemState = {
  status: ResultStatus.UNINITIALIZED,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<ResultStatus>) => {
      state.status = action.payload;
    },
  },
});

export const { setStatus } = systemSlice.actions;
export const systemReducer = systemSlice.reducer;
export const systemInitialState = systemSlice.getInitialState();
