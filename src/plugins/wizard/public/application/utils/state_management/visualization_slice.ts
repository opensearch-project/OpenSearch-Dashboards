/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CreateAggConfigParams } from 'src/plugins/data/common';
import { Schema } from '../../../../../vis_default_editor/public';
import { WizardServices } from '../../../types';

interface VisualizationState {
  indexPattern?: string;
  searchField: string;
  activeVisualization?: {
    name: string;
    aggConfigParams: CreateAggConfigParams[];
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
    },
    setSearchField: (state, action: PayloadAction<string>) => {
      state.searchField = action.payload;
    },
    addAggInstance: (state, action: PayloadAction<{ schema: Schema; fieldName?: string }>) => {
      const { schema, fieldName } = action.payload;
      const defaultAggType = (schema.defaults as any).aggType;

      const configParams = {
        type: defaultAggType,
        schema: schema.name,
        params: {} as any,
      };

      if (fieldName) {
        configParams.params.field = fieldName;
      }

      state.activeVisualization?.aggConfigParams.push(configParams);
    },
    deleteAggInstance: (state, action: PayloadAction<string>) => {
      // const aggConfigs = state.activeVisualization!.aggConfigs;
      // const aggId = action.payload;
      // const filteredAggs = aggConfigs.aggs.filter((agg) => agg.id !== aggId);
    },
  },
});

export const { reducer } = slice;
export const {
  setActiveVisualization,
  setIndexPattern,
  setSearchField,
  addAggInstance,
} = slice.actions;
