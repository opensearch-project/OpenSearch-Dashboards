/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Filter, Query } from '../../../../../data/public';
import { BuildDiscoverServices } from '../../../build_services';
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

export const getPreloadedState = async ({
  data,
}: BuildDiscoverServices): Promise<DiscoverState> => {
  return {
    ...initialState,
  };
};

export const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    setState(state, action: PayloadAction<DiscoverState>) {
      return action.payload;
    },
    addColumn(
      state,
      action: PayloadAction<{
        column: string;
        index?: number;
      }>
    ) {
      const { column, index } = action.payload;
      const columns = [...(state.columns || [])];
      if (index !== undefined) {
        columns.splice(index, 0, column);
      } else {
        columns.push(column);
      }
      state = {
        ...state,
        columns,
      };

      return state;
    },
    removeColumn(state, action: PayloadAction<string>) {
      state = {
        ...state,
        columns: (state.columns || []).filter((column) => column !== action.payload),
      };

      return state;
    },
    reorderColumn(state, action: PayloadAction<{ source: number; destination: number }>) {
      const { source, destination } = action.payload;
      const columns = [...(state.columns || [])];
      const [removed] = columns.splice(source, 1);
      columns.splice(destination, 0, removed);
      state = {
        ...state,
        columns,
      };

      return state;
    },
    updateState(state, action: PayloadAction<Partial<DiscoverState>>) {
      state = {
        ...state,
        ...action.payload,
      };

      return state;
    },
  },
});

// Exposing the state functions as generics
export const {
  addColumn,
  removeColumn,
  reorderColumn,
  setState,
  updateState,
} = discoverSlice.actions;
export const { reducer } = discoverSlice;
