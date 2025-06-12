/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResultStatus } from '../../../legacy/discover/application/view_components/utils/use_search';

export interface UIState {
  activeTabId: string;
  flavor: string;
  status: ResultStatus;
  executionCacheKeys: string[];
  transaction: {
    inProgress: boolean;
    pendingActions: string[];
  };
}

const initialState: UIState = {
  activeTabId: 'logs',
  flavor: 'log',
  status: ResultStatus.UNINITIALIZED,
  executionCacheKeys: [],
  transaction: {
    inProgress: false,
    pendingActions: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    setFlavor: (state, action: PayloadAction<string>) => {
      state.flavor = action.payload;
    },
    setStatus: (state, action: PayloadAction<ResultStatus>) => {
      state.status = action.payload;
    },
    setExecutionCacheKeys: (state, action: PayloadAction<string[]>) => {
      state.executionCacheKeys = action.payload;
    },
    // Transaction actions
    startTransaction: (
      state,
      action: PayloadAction<{ previousState: Record<string, unknown> }>
    ) => {
      state.transaction.inProgress = true;
      state.transaction.pendingActions = [];
    },
    commitTransaction: (state) => {
      state.transaction.inProgress = false;
      state.transaction.pendingActions = [];
    },
    rollbackTransaction: (state, action: PayloadAction<string>) => {
      state.transaction.inProgress = false;
      state.transaction.pendingActions = [];
    },
  },
});

export const {
  setActiveTab,
  setFlavor,
  setStatus,
  setExecutionCacheKeys,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
