/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  showHistogram: boolean;
  wrapCellText: boolean;
  /**
   * Hides table columns whose value is empty in every row of the result set, and fields with no
   * value in expanded rows. Off by default so the table shows exactly the columns that were asked
   * for until the user opts in.
   */
  hideEmptyFields: boolean;
  /**
   * Draws string values that hold JSON as a collapsible tree. Unset means on, so state saved
   * before this setting existed shows them as trees too.
   */
  showJsonFormat?: boolean;
  /**
   * Opens up to 15 levels of each JSON tree in the table, or only the top level of a whole field
   * value over 50,000 characters. Only applies while showJsonFormat is on.
   */
  expandAllJson?: boolean;
  metricsPageMode?: 'explore' | 'query';
}

const initialState: UIState = {
  activeTabId: '',
  showHistogram: true,
  wrapCellText: false,
  hideEmptyFields: false,
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
    setHideEmptyFields: (state, action: PayloadAction<boolean>) => {
      state.hideEmptyFields = action.payload;
    },
    setShowJsonFormat: (state, action: PayloadAction<boolean>) => {
      state.showJsonFormat = action.payload;
    },
    setExpandAllJson: (state, action: PayloadAction<boolean>) => {
      state.expandAllJson = action.payload;
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
  setHideEmptyFields,
  setShowJsonFormat,
  setExpandAllJson,
  setMetricsPageMode,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
