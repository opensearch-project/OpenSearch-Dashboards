/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CreateAggConfigParams } from 'src/plugins/data/common';
import { WizardServices } from '../../../types';

interface VisualizationState {
  indexPattern?: string;
  searchField: string;
  activeVisualization?: {
    name: string;
    aggConfigParams: CreateAggConfigParams[];
    activeAgg?: CreateAggConfigParams;
  };
}

const initialState: VisualizationState = {
  searchField: '',
};

export const getPreloadedState = async ({
  types,
  data,
}: WizardServices): Promise<VisualizationState> => {
  const preloadedState = { ...initialState };

  const defaultVisualization = types.all()[0];
  const defaultIndexPattern = await data.indexPatterns.getDefault();
  const name = defaultVisualization.name;
  if (name && defaultIndexPattern) {
    preloadedState.activeVisualization = {
      name,
      aggConfigParams: [],
    };

    preloadedState.indexPattern = defaultIndexPattern.id;
  }

  return preloadedState;
};

export const slice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    setActiveVisualization: (
      state,
      action: PayloadAction<VisualizationState['activeVisualization']>
    ) => {
      state.activeVisualization = action.payload;
    },
    setIndexPattern: (state, action: PayloadAction<string>) => {
      state.indexPattern = action.payload;
      state.activeVisualization!.aggConfigParams = [];
    },
    setSearchField: (state, action: PayloadAction<string>) => {
      state.searchField = action.payload;
    },
    createAggConfigParams: (state, action: PayloadAction<CreateAggConfigParams>) => {
      state.activeVisualization!.activeAgg = action.payload;
    },
    saveAggConfigParams: (state, action: PayloadAction<CreateAggConfigParams>) => {
      delete state.activeVisualization!.activeAgg;

      // TODO: Impliment reducer
    },
    reorderAggConfigParams: (
      state,
      action: PayloadAction<{
        sourceId: string;
        destinationId: string;
      }>
    ) => {
      const { sourceId, destinationId } = action.payload;
      const aggParams = state.activeVisualization!.aggConfigParams;
      const newAggs = [...aggParams];
      const destinationIndex = newAggs.findIndex((agg) => agg.id === destinationId);
      newAggs.splice(
        destinationIndex,
        0,
        newAggs.splice(
          aggParams.findIndex((agg) => agg.id === sourceId),
          1
        )[0]
      );

      state.activeVisualization!.aggConfigParams = newAggs;
    },
    updateAggConfigParams: (state, action: PayloadAction<CreateAggConfigParams[]>) => {
      state.activeVisualization!.aggConfigParams = action.payload;
    },
  },
});

export const { reducer } = slice;
export const {
  setActiveVisualization,
  setIndexPattern,
  setSearchField,
  createAggConfigParams,
  updateAggConfigParams,
  reorderAggConfigParams,
} = slice.actions;
