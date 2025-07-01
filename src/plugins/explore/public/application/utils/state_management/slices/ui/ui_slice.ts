/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ChartStyleControlMap,
  ChartType,
} from '../../../../../components/visualizations/utils/use_visualization_types';

export interface UIState {
  activeTabId: string;
  flavor: string;
  showDatasetFields: boolean;
  prompt?: string; // Optional prompt for query panel
  styleOptions: ChartStyleControlMap[ChartType] | undefined;
  chartType: ChartType;
}

const initialState: UIState = {
  activeTabId: 'logs',
  flavor: 'log',
  showDatasetFields: true,
  prompt: '', // Initialize prompt as empty string
  styleOptions: undefined,
  chartType: 'line',
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
    setStyleOptions: (state, action: PayloadAction<ChartStyleControlMap[ChartType]>) => {
      state.styleOptions = action.payload;
    },
    setChartType: (state, action: PayloadAction<ChartType>) => {
      state.chartType = action.payload;
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
