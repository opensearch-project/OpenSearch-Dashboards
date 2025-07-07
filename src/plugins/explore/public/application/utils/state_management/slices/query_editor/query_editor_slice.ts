/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EditorMode, QueryExecutionStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

export interface QueryEditorSliceState {
  executionStatus: QueryExecutionStatus;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
}

const initialState: QueryEditorSliceState = {
  executionStatus: QueryExecutionStatus.UNINITIALIZED,
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
    setExecutionStatus: (state, action: PayloadAction<QueryExecutionStatus>) => {
      state.executionStatus = action.payload;
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
  setExecutionStatus,
  setEditorMode,
  // TODO: Need to use this when we change data set
  setPromptModeIsAvailable,
  resetEditorMode,
  toggleDualEditorMode,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = initialState;
