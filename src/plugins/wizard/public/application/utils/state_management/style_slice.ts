/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';

type StyleState = any;

const initialState = {} as StyleState;

export const getPreloadedState = async ({ types, data }: WizardServices): Promise<StyleState> => {
  let preloadedState = initialState;

  // debugger;

  const defaultVisualization = types.all()[0];
  const defaultState = defaultVisualization.ui.containerConfig.style.defaults;
  if (defaultState) {
    preloadedState = defaultState;
  }

  return preloadedState;
};

export const styleSlice = createSlice({
  name: 'style',
  initialState,
  reducers: {
    setState(state, action: PayloadAction<StyleState>) {
      state = action.payload;
    },
    updateState(state, action: PayloadAction<Partial<StyleState>>) {
      state = {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { reducer } = styleSlice;
export const { setState, updateState } = styleSlice.actions;
