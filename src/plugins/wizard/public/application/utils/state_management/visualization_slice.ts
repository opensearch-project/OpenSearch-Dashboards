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
    activeAggId?: string;
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
    createAgg: (
      state,
      action: PayloadAction<{ id: string; aggConfigParams: CreateAggConfigParams[] }>
    ) => {
      const { aggConfigParams, id } = action.payload;

      state.activeVisualization!.aggConfigParams = aggConfigParams;
      state.activeVisualization!.activeAggId = id;
    },
    editAgg: (state, action: PayloadAction<string>) => {
      state.activeVisualization!.activeAggId = action.payload;
    },
    saveAgg: (state, action: PayloadAction<boolean>) => {
      // Delete the aggConfigParam if the save is not true
      if (!action.payload) {
        const activeAggId = state.activeVisualization!.activeAggId;
        const aggIndex = state.activeVisualization!.aggConfigParams.findIndex(
          (agg) => agg.id === activeAggId
        );
        state.activeVisualization!.aggConfigParams.splice(aggIndex, 1);
      }
      delete state.activeVisualization!.activeAggId;
    },
    deleteAgg: (state, action: PayloadAction<undefined>) => {
      delete state.activeVisualization!.activeAggId;
    },
    reorderAgg: (
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
    updateActiveAgg: (state, action: PayloadAction<CreateAggConfigParams>) => {
      const activeAggId = state.activeVisualization!.activeAggId;
      const aggIndex = state.activeVisualization!.aggConfigParams.findIndex(
        (agg) => agg.id === activeAggId
      );

      if (aggIndex !== -1) {
        state.activeVisualization!.aggConfigParams[aggIndex] = action.payload;
      }
    },
  },
});

export const { reducer } = slice;
export const {
  setActiveVisualization,
  setIndexPattern,
  setSearchField,
  editAgg,
  createAgg,
  updateAggConfigParams,
  updateActiveAgg,
  saveAgg,
  reorderAgg,
} = slice.actions;
