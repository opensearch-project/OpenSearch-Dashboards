/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataSource } from 'src/plugins/data/public';
import { DataExplorerServices } from '../../types';

export interface MetadataState {
  indexPattern?: string;
  dataSource?: DataSource;
  originatingApp?: string;
  view?: string;
}

const initialState: MetadataState = {};

export const getPreloadedState = async ({
  embeddable,
  scopedHistory,
  data,
}: DataExplorerServices): Promise<MetadataState> => {
  const { originatingApp } =
    embeddable
      .getStateTransfer(scopedHistory)
      .getIncomingEditorState({ keysToRemoveAfterFetch: ['id', 'input'] }) || {};
  const defaultIndexPattern = await data.indexPatterns.getDefault();
  const preloadedState: MetadataState = {
    ...initialState,
    originatingApp,
    indexPattern: defaultIndexPattern?.id,
  };

  return preloadedState;
};

export const slice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setIndexPattern: (state, action: PayloadAction<string>) => {
      state.indexPattern = action.payload;
    },
    setDataSource: (state, action: PayloadAction<DataSource>) => {
      state.dataSource = action.payload;
    },
    setOriginatingApp: (state, action: PayloadAction<string | undefined>) => {
      state.originatingApp = action.payload;
    },
    setView: (state, action: PayloadAction<string>) => {
      state.view = action.payload;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const {
  setIndexPattern,
  setDataSource,
  setOriginatingApp,
  setView,
  setState,
} = slice.actions;
