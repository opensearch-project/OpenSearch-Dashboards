/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';
import { setActiveVisualization } from './shared_actions';

export type StyleState<T = any> = T;

const initialState = {} as StyleState;

export const getPreloadedState = async ({ types, data }: WizardServices): Promise<StyleState> => {
  let preloadedState = initialState;

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
    setState<T>(state: T, action: PayloadAction<StyleState<T>>) {
      return action.payload;
    },
    updateState<T>(state: T, action: PayloadAction<Partial<StyleState<T>>>) {
      state = {
        ...state,
        ...action.payload,
      };
    },
  },
  extraReducers(builder) {
    builder.addCase(setActiveVisualization, (state, action) => {
      return action.payload.style;
    });
  },
});

// Exposing the state functions as generics
export const setState = styleSlice.actions.setState as <T>(payload: T) => PayloadAction<T>;
export const updateState = styleSlice.actions.updateState as <T>(
  payload: Partial<T>
) => PayloadAction<Partial<T>>;

export const { reducer } = styleSlice;
