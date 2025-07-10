/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  showFilterPanel: boolean;
  showHistogram: boolean;
}

const initialState: UIState = {
  activeTabId: 'logs',
  showFilterPanel: true,
  showHistogram: true,
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
    setShowFilterPanel: (state, action: PayloadAction<boolean>) => {
      state.showFilterPanel = action.payload;
    },
    setShowHistogram: (state, action: PayloadAction<boolean>) => {
      state.showHistogram = action.payload;
    },
  },
});

export const { setActiveTab, setShowFilterPanel, setUiState, setShowHistogram } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
