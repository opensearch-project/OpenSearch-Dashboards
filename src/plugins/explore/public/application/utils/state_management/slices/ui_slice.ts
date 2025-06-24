/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResultStatus } from '../../../legacy/discover/application/view_components/utils/use_search';
import {
  ChartStyleControlMap,
  ChartType,
} from '../../../../components/visualizations/utils/use_visualization_types';

export interface UIState {
  activeTabId: string;
  flavor: string;
  status: ResultStatus;
  showDatasetFields: boolean;
  executionCacheKeys: string[];
  transaction: {
    inProgress: boolean;
    pendingActions: string[];
  };
  prompt?: string; // Optional prompt for query panel
  styleOptions: ChartStyleControlMap[ChartType] | undefined;
}

const initialState: UIState = {
  activeTabId: 'logs',
  flavor: 'log',
  status: ResultStatus.UNINITIALIZED,
  showDatasetFields: true,
  executionCacheKeys: [],
  transaction: {
    inProgress: false,
    pendingActions: [],
  },
  prompt: '', // Initialize prompt as empty string
  styleOptions: undefined,
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
    setShowDatasetFields: (state, action: PayloadAction<boolean>) => {
      state.showDatasetFields = action.payload;
    },
    setExecutionCacheKeys: (state, action: PayloadAction<string[]>) => {
      state.executionCacheKeys = action.payload;
    },
    setQueryPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
    setStyleOptions: (state, action: PayloadAction<ChartStyleControlMap[ChartType]>) => {
      state.styleOptions = action.payload;
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
  setShowDatasetFields,
  setExecutionCacheKeys,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
  setStyleOptions,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
