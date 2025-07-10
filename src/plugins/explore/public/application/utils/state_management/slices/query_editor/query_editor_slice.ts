/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorMode, QueryExecutionStatus, QueryResultStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

export interface QueryStatusMap {
  [cacheKey: string]: QueryResultStatus;
}

export interface QueryEditorSliceState {
  queryStatusMap: QueryStatusMap;
  overallQueryStatus: QueryResultStatus;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
  promptToQueryIsLoading: boolean;
  summaryAgentIsAvailable: boolean;
  lastExecutedPrompt: string;
  lastExecutedTranslatedQuery: string;
}

const initialState: QueryEditorSliceState = {
  queryStatusMap: {},
  overallQueryStatus: {
    status: QueryExecutionStatus.UNINITIALIZED,
    elapsedMs: undefined,
    startTime: undefined,
  },
  editorMode: DEFAULT_EDITOR_MODE,
  promptModeIsAvailable: false,
  promptToQueryIsLoading: false,
  summaryAgentIsAvailable: false,
  lastExecutedPrompt: '',
  lastExecutedTranslatedQuery: '',
};

const queryEditorSlice = createSlice({
  name: 'queryEditor',
  initialState,
  reducers: {
    setQueryEditorState: (_, action: PayloadAction<QueryEditorSliceState>) => {
      return action.payload;
    },

    setIndividualQueryStatus: (
      state,
      action: PayloadAction<{
        cacheKey: string;
        status: QueryResultStatus;
      }>
    ) => {
      const { cacheKey, status } = action.payload;
      state.queryStatusMap[cacheKey] = status;
    },

    setOverallQueryStatus: (state, action: PayloadAction<QueryResultStatus>) => {
      state.overallQueryStatus = action.payload;
    },

    updateOverallQueryStatus: (state, action: PayloadAction<Partial<QueryResultStatus>>) => {
      state.overallQueryStatus = {
        ...state.overallQueryStatus,
        ...action.payload,
      };
    },

    clearQueryStatusMapByKey: (state, action: PayloadAction<string>) => {
      const cacheKey = action.payload;
      if (state.queryStatusMap[cacheKey]) {
        delete state.queryStatusMap[cacheKey];
      }
    },

    clearQueryStatusMap: (state) => {
      state.queryStatusMap = {};
      state.overallQueryStatus = {
        status: QueryExecutionStatus.UNINITIALIZED,
        elapsedMs: undefined,
        startTime: undefined,
        error: undefined,
      };
    },

    // Legacy actions for backward compatibility
    setQueryStatus: (state, action: PayloadAction<QueryResultStatus>) => {
      state.overallQueryStatus = action.payload;
    },
    updateQueryStatus: (state, action: PayloadAction<Partial<QueryResultStatus>>) => {
      state.overallQueryStatus = { ...state.overallQueryStatus, ...action.payload };
    },

    // Keep existing actions unchanged
    setEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.editorMode = action.payload;
    },
    setPromptModeIsAvailable: (state, action: PayloadAction<boolean>) => {
      state.promptModeIsAvailable = action.payload;
    },
    setPromptToQueryIsLoading: (state, action: PayloadAction<boolean>) => {
      state.promptToQueryIsLoading = action.payload;
    },
    setSummaryAgentIsAvailable: (state, action: PayloadAction<boolean>) => {
      state.summaryAgentIsAvailable = action.payload;
    },
    setLastExecutedPrompt: (state, action: PayloadAction<string>) => {
      state.lastExecutedPrompt = action.payload;
    },
    resetEditorMode: (state) => {
      state.editorMode = DEFAULT_EDITOR_MODE;
    },
    setLastExecutedTranslatedQuery: (state, action: PayloadAction<string>) => {
      state.lastExecutedTranslatedQuery = action.payload;
    },
    clearLastExecutedData: (state) => {
      state.lastExecutedPrompt = '';
      state.lastExecutedTranslatedQuery = '';
    },
  },
});

export const {
  setQueryEditorState,
  setIndividualQueryStatus,
  setOverallQueryStatus,
  updateOverallQueryStatus,
  clearQueryStatusMapByKey,
  clearQueryStatusMap,
  setQueryStatus,
  updateQueryStatus,
  resetEditorMode,
  setEditorMode,
  setLastExecutedPrompt,
  setLastExecutedTranslatedQuery,
  setPromptModeIsAvailable,
  setPromptToQueryIsLoading,
  clearLastExecutedData,
  setSummaryAgentIsAvailable,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = initialState;
