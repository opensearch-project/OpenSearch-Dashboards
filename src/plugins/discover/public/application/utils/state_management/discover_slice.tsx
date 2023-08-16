/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { matchPath } from 'react-router-dom';
import { Filter, Query } from '../../../../../data/public';
import { DiscoverServices } from '../../../build_services';
import { RootState, DefaultViewState } from '../../../../../data_explorer/public';
import { buildColumns } from '../columns';

export interface DiscoverState {
  /**
   * Columns displayed in the table
   */
  columns: string[];
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
  sort: Array<[string, string]>;
  /**
   * id of the used saved search
   */
  savedSearch?: string;
  /**
   * dirty flag to indicate if the saved search has been modified
   * since the last save
   */
  isDirty: boolean;
}

export interface DiscoverRootState extends RootState {
  discover: DiscoverState;
}

const initialState: DiscoverState = {
  columns: ['_source'],
  sort: [],
  isDirty: false,
};

export const getPreloadedState = async ({
  getSavedSearchById,
}: DiscoverServices): Promise<DefaultViewState<DiscoverState>> => {
  const preloadedState: DefaultViewState<DiscoverState> = {
    state: {
      ...initialState,
    },
  };

  const hashPath = window.location.hash.split('?')[0]; // hack to remove query params since matchPath considers them part of the id
  const savedSearchId = matchPath<{ id?: string }>(hashPath, {
    path: '#/view/:id',
  })?.params.id;

  if (savedSearchId) {
    const savedSearchInstance = await getSavedSearchById(savedSearchId);

    if (savedSearchInstance) {
      preloadedState.state.columns = savedSearchInstance.columns;
      preloadedState.state.sort = savedSearchInstance.sort;
      preloadedState.state.savedSearch = savedSearchInstance.id;
      const indexPatternId = savedSearchInstance.searchSource.getField('index')?.id;
      preloadedState.root = {
        metadata: {
          indexPattern: indexPatternId,
        },
      };

      savedSearchInstance.destroy(); // this instance is no longer needed, will create another one later
    }
  }

  return preloadedState;
};

export const discoverSlice = createSlice({
  name: 'discover',
  initialState,
  reducers: {
    setState(state, action: PayloadAction<DiscoverState>) {
      return action.payload;
    },
    addColumn(state, action: PayloadAction<{ column: string; index?: number }>) {
      const { column, index } = action.payload;
      const columns = [...(state.columns || [])];
      if (index !== undefined) columns.splice(index, 0, column);
      else columns.push(column);
      return { ...state, columns: buildColumns(columns), isDirty: true };
    },
    removeColumn(state, action: PayloadAction<string>) {
      const columns = (state.columns || []).filter((column) => column !== action.payload);
      return {
        ...state,
        columns: buildColumns(columns),
        isDirty: true,
      };
    },
    reorderColumn(state, action: PayloadAction<{ source: number; destination: number }>) {
      const { source, destination } = action.payload;
      const columns = [...(state.columns || [])];
      const [removed] = columns.splice(source, 1);
      columns.splice(destination, 0, removed);
      return {
        ...state,
        columns,
        isDirty: true,
      };
    },
    updateState(state, action: PayloadAction<Partial<DiscoverState>>) {
      return {
        ...state,
        ...action.payload,
      };
    },
    setSavedSearchId(state, action: PayloadAction<string>) {
      return {
        ...state,
        savedSearch: action.payload,
        isDirty: false,
      };
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
  setSavedSearchId,
} = discoverSlice.actions;
export const { reducer } = discoverSlice;
