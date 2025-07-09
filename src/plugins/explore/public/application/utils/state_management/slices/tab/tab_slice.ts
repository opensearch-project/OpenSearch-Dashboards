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
import { AxisColumnMappings, AxisRole } from '../../../../../components/visualizations/types';

export interface TabState {
  logs: {};
  visualizations: {
    styleOptions: ChartStyleControlMap[ChartType] | undefined;
    chartType: ChartType | undefined;
    axesMapping: Partial<Record<AxisRole, string>>;
  };
}

const initialState: TabState = {
  logs: {},
  visualizations: {
    styleOptions: defaultMetricChartStyles,
    chartType: undefined,
    axesMapping: {},
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
    setChartType: (state, action: PayloadAction<ChartType | undefined>) => {
      state.visualizations.chartType = action.payload;
    },
    setAxesMapping: (state, action: PayloadAction<Partial<Record<AxisRole, string>>>) => {
      state.visualizations.axesMapping = action.payload;
    },
  },
});

export const { setTabState, setStyleOptions, setChartType, setAxesMapping } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
