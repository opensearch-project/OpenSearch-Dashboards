/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';

interface VisualizationState {
  activeVisualization: string | null;
}

const initialState: VisualizationState = {
  activeVisualization: null,
};

export const getPreloadedState = async ({ types }: WizardServices): Promise<VisualizationState> => {
  const preloadedState = { ...initialState };

  const defaultVisualization = types.all()[0];
  if (defaultVisualization) {
    preloadedState.activeVisualization = defaultVisualization.name;
  }

  return preloadedState;
};

export const slice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setActiveVisualization: (state, action: PayloadAction<string>) => {
      state.activeVisualization = action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setActiveVisualization } = slice.actions;
