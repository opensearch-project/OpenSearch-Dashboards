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
  lastExecutedPrompt: string;
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
  lastExecutedPrompt: '',
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
    setLastExecutedPrompt: (state, action: PayloadAction<string>) => {
      state.lastExecutedPrompt = action.payload;
    },
  },
});

export const {
  setQueryEditorState,
  setQueryStatus,
  updateQueryStatus,
  setEditorMode,
  setLastExecutedPrompt,
  setPromptModeIsAvailable,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = initialState;
