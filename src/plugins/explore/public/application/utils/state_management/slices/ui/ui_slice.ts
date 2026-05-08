/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  showHistogram: boolean;
  wrapCellText: boolean;
  metricsPageMode?: 'explore' | 'query';
}

const initialState: UIState = {
  activeTabId: '',
  showHistogram: true,
  wrapCellText: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setUiState: (state, action: PayloadAction<Partial<UIState>>) => {
      return { ...state, ...action.payload };
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    setShowHistogram: (state, action: PayloadAction<boolean>) => {
      state.showHistogram = action.payload;
    },
    setWrapCellText: (state, action: PayloadAction<boolean>) => {
      state.wrapCellText = action.payload;
    },
    setMetricsPageMode: (state, action: PayloadAction<'explore' | 'query'>) => {
      state.metricsPageMode = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setUiState,
  setShowHistogram,
  setWrapCellText,
  setMetricsPageMode,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
