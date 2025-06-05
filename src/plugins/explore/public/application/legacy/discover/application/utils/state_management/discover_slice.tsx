/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { matchPath } from 'react-router-dom';
import { LOGS_VIEW_ID } from '../../../../../../../common';
import { Filter, Query } from '../../../../../../../../data/public';
import { DiscoverServices } from '../../../build_services';
import { DefaultViewState } from '../../../../data_explorer';
import { buildColumns } from '../columns';
import * as utils from './common';
import { SortOrder } from '../../../../../../types/saved_explore_types';
import {
  DEFAULT_COLUMNS_SETTING,
  QUERY_ENHANCEMENT_ENABLED_SETTING,
} from '../../../../../../../common/legacy/discover';

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
  sort: SortOrder[];
  /**
   * id of the used saved search
   */
  savedSearch?: string;
  /**
   * dirty flag to indicate if the saved search has been modified
   * since the last save
   */
  isDirty?: boolean;
  /**
   * Metadata for the view
   */
  savedQuery?: string;
  metadata?: {
    /**
     * Number of lines to display per row
     */
    lineCount?: number;
  };
  /**
   * count of the number of times saved explore has loaded. This is a temporary solution to make discover work in explore
   */
  saveExploreLoadCount: number;
}

const initialState: DiscoverState = {
  columns: ['_source'],
  sort: [],
  isDirty: false,
  saveExploreLoadCount: 0,
};

export const getPreloadedState = async ({
  getSavedSearchById,
  uiSettings: config,
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
          ...(indexPatternId &&
            !config.get(QUERY_ENHANCEMENT_ENABLED_SETTING) && { indexPattern: indexPatternId }),
          view: LOGS_VIEW_ID,
        },
      };

      savedSearchInstance.destroy(); // this instance is no longer needed, will create another one later
    }
  } else if (config.get(DEFAULT_COLUMNS_SETTING)) {
    preloadedState.state.columns = config.get(DEFAULT_COLUMNS_SETTING);
  }

  return preloadedState;
};

export const discoverSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setState(state, action: PayloadAction<DiscoverState>) {
      return action.payload;
    },
    addColumn(state, action: PayloadAction<{ column: string; index?: number }>) {
      const columns = utils.addColumn(state.columns || [], action.payload);
      return { ...state, columns: buildColumns(columns) };
    },
    removeColumn(state, action: PayloadAction<string>) {
      const columns = utils.removeColumn(state.columns, action.payload);
      const sort =
        state.sort && state.sort.length ? state.sort.filter((s) => s[0] !== action.payload) : [];
      return {
        ...state,
        columns: buildColumns(columns),
        sort,
        isDirty: true,
      };
    },
    reorderColumn(state, action: PayloadAction<{ source: number; destination: number }>) {
      const columns = utils.reorderColumn(
        state.columns,
        action.payload.source,
        action.payload.destination
      );
      return {
        ...state,
        columns,
        isDirty: true,
      };
    },
    moveColumn(state, action: PayloadAction<{ columnName: string; destination: number }>) {
      const columns = utils.moveColumn(
        state.columns,
        action.payload.columnName,
        action.payload.destination
      );
      return {
        ...state,
        columns,
      };
    },
    setColumns(state, action: PayloadAction<{ columns: string[] }>) {
      return {
        ...state,
        columns: action.payload.columns,
      };
    },
    setSort(state, action: PayloadAction<SortOrder[]>) {
      return {
        ...state,
        sort: action.payload,
      };
    },
    setInterval(state, action: PayloadAction<string>) {
      return {
        ...state,
        interval: action.payload,
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
    incrementSaveExploreLoadCount(state) {
      return {
        ...state,
        saveExploreLoadCount: state.saveExploreLoadCount + 1,
      };
    },
    setMetadata(state, action: PayloadAction<Partial<DiscoverState['metadata']>>) {
      return {
        ...state,
        metadata: {
          ...state.metadata,
          ...action.payload,
        },
      };
    },
    setSavedQuery(state, action: PayloadAction<string | undefined>) {
      if (action.payload === undefined) {
        // if the payload is undefined, remove the savedQuery property
        const { savedQuery, ...restState } = state;
        return restState;
      } else {
        return {
          ...state,
          savedQuery: action.payload,
        };
      }
    },
  },
});

// Exposing the state functions as generics
export const {
  addColumn,
  removeColumn,
  reorderColumn,
  moveColumn,
  setColumns,
  setSort,
  setInterval,
  setState,
  updateState,
  setSavedSearchId,
  setMetadata,
  setSavedQuery,
} = discoverSlice.actions;
export const { reducer } = discoverSlice;
