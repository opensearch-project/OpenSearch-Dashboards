/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query, TimeRange } from '../../../../../data/common';
import { WizardServices } from '../../../types';

interface MetadataState {
  query?: Query;
  dateRange?: TimeRange;
}

const initialState = {} as MetadataState;

export const getPreloadedState = async ({
  types,
  data,
}: WizardServices): Promise<MetadataState> => {
  const preloadedState = initialState;

  return preloadedState;
};

export const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setTopNav: (state, action: PayloadAction<{ query?: Query; dateRange: TimeRange }>) => {
      state.query = action.payload.query;
      state.dateRange = action.payload.dateRange;
    },
  },
});

export const { reducer } = metadataSlice;
export const { setTopNav } = metadataSlice.actions;
