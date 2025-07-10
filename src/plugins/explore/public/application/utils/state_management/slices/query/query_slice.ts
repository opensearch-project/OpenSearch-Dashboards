/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query, DataView, Dataset } from '../../../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';
import { QueryWithQueryAsString } from '../../../languages';

export type QueryState = QueryWithQueryAsString;

const getSerializableDataset = (dataset?: Dataset | DataView): Dataset | undefined => {
  if (!dataset) return undefined;

  if (!('toDataset' in dataset)) {
    return dataset as Dataset;
  }

  return dataset.toDataset();
};

const initialState: QueryState = {
  query: '',
  language: EXPLORE_DEFAULT_LANGUAGE,
  dataset: undefined,
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setDataset: (state, action: PayloadAction<Dataset | undefined>) => {
      state.dataset = getSerializableDataset(action.payload);
    },
    setQueryState: (_, action: PayloadAction<Query>) => {
      const payload = { ...action.payload };
      if (payload.dataset) {
        payload.dataset = getSerializableDataset(payload.dataset);
      }
      return {
        ...action.payload,
        ...(payload.dataset ? { dataset: getSerializableDataset(payload.dataset) } : {}),
        query: typeof action.payload.query === 'string' ? action.payload.query : '',
      };
    },
    setQueryWithHistory: {
      reducer: (_, action: PayloadAction<QueryState>) => {
        // Same logic as setQueryState but with meta flag for history
        const payload = { ...action.payload };
        if (payload.dataset) {
          payload.dataset = getSerializableDataset(payload.dataset);
        }
        return payload;
      },
      prepare: (query: Query) => ({
        payload: {
          ...query,
          query: typeof query.query === 'string' ? query.query : '',
        },
        meta: { addToHistory: true },
      }),
    },
    setQueryStringWithHistory: {
      reducer: (state, action: PayloadAction<string>) => {
        // Same logic as setQueryState but with meta flag for history
        state.query = action.payload;
      },
      prepare: (query: string) => ({
        payload: query,
        meta: { addToHistory: true },
      }),
    },
  },
});

export const {
  setDataset,
  setQueryState,
  setQueryWithHistory,
  setQueryStringWithHistory,
} = querySlice.actions;
export const queryReducer = querySlice.reducer;
export const queryInitialState = querySlice.getInitialState();
