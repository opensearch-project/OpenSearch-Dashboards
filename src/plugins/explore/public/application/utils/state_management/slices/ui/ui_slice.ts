/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  flavor: string;
  showDatasetFields: boolean;
  prompt?: string; // Optional prompt for query panel
}

const initialState: UIState = {
  activeTabId: 'logs',
  flavor: 'log',
  showDatasetFields: true,
  prompt: '', // Initialize prompt as empty string
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
    setFlavor: (state, action: PayloadAction<string>) => {
      state.flavor = action.payload;
    },
    setShowDatasetFields: (state, action: PayloadAction<boolean>) => {
      state.showDatasetFields = action.payload;
    },
    setQueryPrompt: (state, action: PayloadAction<string>) => {
      state.prompt = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setFlavor,
  setShowDatasetFields,
  setQueryPrompt,
  setUiState,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
