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
import { AxisRole } from '../../../../../components/visualizations/types';

export interface TabState {
  logs: {};
  visualizations: {
    styleOptions: ChartStyleControlMap[ChartType] | undefined;
    chartType: ChartType | undefined;
    axesMapping?: Partial<Record<AxisRole, string>>;
  };
  patterns: {
    patternsField?: string; // kept as string, patterns tab will check if the field matches one in the schema
    usingRegexPatterns: boolean;
  };
}

const initialState: TabState = {
  logs: {},
  visualizations: {
    styleOptions: defaultMetricChartStyles,
    chartType: undefined,
    axesMapping: {},
  },
  patterns: {
    patternsField: undefined,
    usingRegexPatterns: false,
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
    setAxesMapping: (
      state,
      action: PayloadAction<Partial<Record<AxisRole, string>> | undefined>
    ) => {
      state.visualizations.axesMapping = action.payload;
    },
    setPatternsField: (state, action: PayloadAction<string>) => {
      state.patterns.patternsField = action.payload;
    },
    setUsingRegexPatterns: (state, action: PayloadAction<boolean>) => {
      state.patterns.usingRegexPatterns = action.payload;
    },
  },
});

export const {
  setTabState,
  setStyleOptions,
  setChartType,
  setAxesMapping,
  setPatternsField,
  setUsingRegexPatterns,
} = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
