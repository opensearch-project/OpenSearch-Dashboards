/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filter, Query } from '../../../../../data/public';
import { DiscoverServices } from '../../../build_services';
import { RootState } from '../../../../../data_explorer/public';

export interface DiscoverState {
  /**
   * Columns displayed in the table
   */
  columns?: string[];
  /**
   * Array of applied filters
   */
  filters?: Filter[];
  /**
   * Used interval of the histogram
   */
  interval?: string;
  /**
   * Lucence or DQL query
   */
  query?: Query;
  /**
   * Array of the used sorting [[field,direction],...]
   */
  sort?: string[][];
  /**
   * id of the used saved query
   */
  savedQuery?: string;
}

export interface DiscoverRootState extends RootState {
  discover: DiscoverState;
}

const initialState = {} as DiscoverState;

export const getPreloadedState = async ({ data }: DiscoverServices): Promise<DiscoverState> => {
  return {
    ...initialState,
    interval: data.query.timefilter.timefilter.getRefreshInterval().value.toString(),
  };
};

export const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    setState<T>(state: T, action: PayloadAction<DiscoverState>) {
      return action.payload;
    },
    updateState<T>(state: T, action: PayloadAction<Partial<DiscoverState>>) {
      state = {
        ...state,
        ...action.payload,
      };

      return state;
    },
  },
});

// Exposing the state functions as generics
export const setState = discoverSlice.actions.setState as <T>(payload: T) => PayloadAction<T>;
export const updateState = discoverSlice.actions.updateState as <T>(
  payload: Partial<T>
) => PayloadAction<Partial<T>>;
export const { reducer } = discoverSlice;
