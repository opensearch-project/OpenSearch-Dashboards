/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ChartStyleControlMap,
  ChartType,
} from '../../../../../components/visualizations/utils/use_visualization_types';
import { defaultMetricChartStyles } from '../../../../../components/visualizations/metric/metric_vis_config';

export interface TabState {
  logs: {};
  visualizations: {
    styleOptions: ChartStyleControlMap[ChartType] | undefined;
    chartType: ChartType;
    fieldNames?: {
      numerical: string[];
      categorical: string[];
      date: string[];
    };
  };
}

const initialState: TabState = {
  logs: {},
  visualizations: {
    styleOptions: defaultMetricChartStyles,
    chartType: 'metric',
  },
};

const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setTabState: (_, action: PayloadAction<TabState>) => {
      return { ...action.payload };
    },
    setStyleOptions: (state, action: PayloadAction<ChartStyleControlMap[ChartType]>) => {
      state.visualizations.styleOptions = action.payload;
    },
    setChartType: (state, action: PayloadAction<ChartType>) => {
      state.visualizations.chartType = action.payload;
    },
    setFieldNames: (
      state,
      action: PayloadAction<{ numerical: string[]; categorical: string[]; date: string[] }>
    ) => {
      state.visualizations.fieldNames = action.payload;
    },
  },
});

export const { setTabState, setStyleOptions, setChartType, setFieldNames } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
