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
    patterns_field?: string; // change the type to be some sort of index field type
    // lastQueryError?: {
    //   code: number;
    //   message: string;
    //   timestamp: number;
    // };
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
    patterns_field: undefined,
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
      state.patterns.patterns_field = action.payload;
    },
    // setPatternQueryError: (state, action: PayloadAction<{ code: number; message: string }>) => {
    //   state.patterns.lastQueryError = {
    //     ...action.payload,
    //     timestamp: Date.now(),
    //   };
    // },
    // clearPatternQueryError: (state) => {
    //   state.patterns.lastQueryError = undefined;
    // },
  },
});

export const {
  setTabState,
  setStyleOptions,
  setChartType,
  setAxesMapping,
  setPatternsField,
  // setPatternQueryError,
  // clearPatternQueryError,
} = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
