/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataExplorerServices } from '../../types';

interface DataSourceMeta {
  ref: string; // MDS ID
  dsName?: string; // flint datasource
}

export interface DataSet {
  id: string | undefined; // index pattern ID, index name, or flintdatasource.database.table
  datasource?: DataSourceMeta;
  meta?: {
    timestampField: string;
    mapping?: any;
  };
  type?: 'dataset' | 'temporary';
}

export interface MetadataState {
  indexPattern?: string;
  originatingApp?: string;
  view?: string;
  dataset?: DataSet;
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
    dataset: {
      id: defaultIndexPattern?.id,
    },
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
    setDataSet: (state, action: PayloadAction<DataSet>) => {
      state.dataset = action.payload;
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
export const { setIndexPattern, setDataSet, setOriginatingApp, setView, setState } = slice.actions;
