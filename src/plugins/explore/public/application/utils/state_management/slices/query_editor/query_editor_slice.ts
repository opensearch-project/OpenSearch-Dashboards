/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorMode, QueryExecutionStatus, QueryResultStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

export interface QueryEditorSliceState {
  queryStatus: QueryResultStatus;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
}

const initialState: QueryEditorSliceState = {
  queryStatus: {
    status: QueryExecutionStatus.UNINITIALIZED,
    elapsedMs: undefined,
    startTime: undefined,
    body: undefined,
  },
  editorMode: DEFAULT_EDITOR_MODE,
  promptModeIsAvailable: false,
};

const queryEditorSlice = createSlice({
  name: 'queryEditor',
  initialState,
  reducers: {
    setQueryEditorState: (_, action: PayloadAction<QueryEditorSliceState>) => {
      return action.payload;
    },
    setQueryStatus: (state, action: PayloadAction<QueryResultStatus>) => {
      state.queryStatus = action.payload;
    },
    updateQueryStatus: (state, action: PayloadAction<Partial<QueryResultStatus>>) => {
      state.queryStatus = { ...state.queryStatus, ...action.payload };
    },
    setEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.editorMode = action.payload;
    },
    setPromptModeIsAvailable: (state, action: PayloadAction<boolean>) => {
      state.promptModeIsAvailable = action.payload;
    },
    resetEditorMode: (state) => {
      state.editorMode = DEFAULT_EDITOR_MODE;
    },
    toggleDualEditorMode: (state) => {
      if (state.editorMode === EditorMode.DualQuery) {
        state.editorMode = EditorMode.DualPrompt;
      } else if (state.editorMode === EditorMode.DualPrompt) {
        state.editorMode = EditorMode.DualQuery;
      }
    },
  },
});

export const {
  setQueryEditorState,
  setQueryStatus,
  updateQueryStatus,
  setEditorMode,
  // TODO: Need to use this when we change data set
  setPromptModeIsAvailable,
  resetEditorMode,
  toggleDualEditorMode,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = initialState;
