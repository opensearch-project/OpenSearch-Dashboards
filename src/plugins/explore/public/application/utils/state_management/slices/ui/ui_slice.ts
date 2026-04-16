/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PrometheusDetectorMode } from '../../../metrics_feature_constants';

export interface MetricsAlertAssociationState {
  detectorId: string;
  detectorName: string;
  monitorId: string;
  monitorName: string;
  promqlQuery: string;
  dataConnectionId: string;
  dataSourceId?: string;
  detectorMode?: PrometheusDetectorMode;
  selectedSeriesId?: string;
  selectedEntityField?: string;
}

export interface UIState {
  activeTabId: string;
  showHistogram: boolean;
  wrapCellText: boolean;
  metricsAlertAssociation?: MetricsAlertAssociationState;
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
    setMetricsAlertAssociation: (
      state,
      action: PayloadAction<MetricsAlertAssociationState | undefined>
    ) => {
      state.metricsAlertAssociation = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setUiState,
  setShowHistogram,
  setWrapCellText,
  setMetricsAlertAssociation,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
