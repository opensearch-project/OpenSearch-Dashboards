/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataExplorerServices } from '../../types';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../components/constants';

export interface MetadataState {
  indexPattern?: string;
  originatingApp?: string;
  view?: string;
  selectedDataset?: any;
}

const initialState: MetadataState = {};

export const getPreloadedState = async ({
  embeddable,
  scopedHistory,
  data,
  uiSettings,
}: DataExplorerServices): Promise<MetadataState> => {
  const { originatingApp } =
    embeddable
      .getStateTransfer(scopedHistory)
      .getIncomingEditorState({ keysToRemoveAfterFetch: ['id', 'input'] }) || {};
  const isQueryEnhancementEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);
  const indexPattern = await data.indexPatterns.getDefault();
  const defaultIndexPattern = isQueryEnhancementEnabled ? undefined : indexPattern;
  const selectedDataset =
    data.query.queryString.getQuery().dataset ||
    data.query.queryString.getDefaultQuery().dataset ||
    undefined;
  const preloadedState: MetadataState = {
    ...initialState,
    originatingApp,
    indexPattern: defaultIndexPattern?.id,
    selectedDataset,
  };

  return preloadedState;
};

export const slice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setIndexPattern: (state, action: PayloadAction<string | undefined>) => {
      state.indexPattern = action.payload;
    },
    setOriginatingApp: (state, action: PayloadAction<string | undefined>) => {
      state.originatingApp = action.payload;
    },
    setView: (state, action: PayloadAction<string>) => {
      state.view = action.payload;
    },
    setSelectedDataset: (state, action: PayloadAction<any>) => {
      state.selectedDataset = action.payload;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const {
  setIndexPattern,
  setOriginatingApp,
  setView,
  setState,
  setSelectedDataset,
} = slice.actions;
