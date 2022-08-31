/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CreateAggConfigParams } from '../../../../../data/common';
import { WizardServices } from '../../../types';
import { setActiveVisualization } from './shared_actions';

export interface VisualizationState {
  indexPattern?: string;
  searchField: string;
  activeVisualization?: {
    name: string;
    aggConfigParams: CreateAggConfigParams[];
    draftAgg?: CreateAggConfigParams;
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
    setIndexPattern: (state, action: PayloadAction<string>) => {
      state.indexPattern = action.payload;
      state.activeVisualization!.aggConfigParams = [];
    },
    setSearchField: (state, action: PayloadAction<string>) => {
      state.searchField = action.payload;
    },
    editDraftAgg: (state, action: PayloadAction<CreateAggConfigParams | undefined>) => {
      state.activeVisualization!.draftAgg = action.payload;
    },
    saveDraftAgg: (state, action: PayloadAction<undefined>) => {
      const draftAgg = state.activeVisualization!.draftAgg;

      if (draftAgg) {
        const aggIndex = state.activeVisualization!.aggConfigParams.findIndex(
          (agg) => agg.id === draftAgg.id
        );

        if (aggIndex === -1) {
          state.activeVisualization!.aggConfigParams.push(draftAgg);
        } else {
          state.activeVisualization!.aggConfigParams.splice(aggIndex, 1, draftAgg);
        }
      }
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
    setState: (_state, action: PayloadAction<VisualizationState>) => {
      return action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(setActiveVisualization, (state, action) => {
      state.activeVisualization = {
        name: action.payload.name,
        aggConfigParams: [],
      };
    });
  },
});

export const { reducer } = slice;
export const {
  setIndexPattern,
  setSearchField,
  editDraftAgg,
  saveDraftAgg,
  updateAggConfigParams,
  reorderAgg,
  setState,
} = slice.actions;
