/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { monaco } from '@osd/monaco';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MutableRefObject } from 'react';
import { EditorMode, QueryExecutionStatus } from '../../types';
import { DEFAULT_EDITOR_MODE } from '../../constants';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type EditorRef = MutableRefObject<IStandaloneCodeEditor | null>;

export interface QueryEditorSliceState {
  executionStatus: QueryExecutionStatus;
  // Refs are not recommended in Redux but we are just going to be writing to these once on mount and then reading from them only
  topEditorRef: EditorRef;
  bottomEditorRef: EditorRef;
  editorMode: EditorMode;
  promptModeIsAvailable: boolean;
}

const initialState: QueryEditorSliceState = {
  executionStatus: QueryExecutionStatus.UNINITIALIZED,
  topEditorRef: { current: null },
  bottomEditorRef: { current: null },
  editorMode: DEFAULT_EDITOR_MODE,
  promptModeIsAvailable: false,
};

const queryEditorSlice = createSlice({
  name: 'queryEditor',
  initialState,
  reducers: {
    setExecutionStatus: (state, action: PayloadAction<QueryExecutionStatus>) => {
      state.executionStatus = action.payload;
    },
    setTopEditorRef: (state, action: PayloadAction<IStandaloneCodeEditor>) => {
      state.topEditorRef.current = action.payload;
    },
    setBottomEditorRef: (state, action: PayloadAction<IStandaloneCodeEditor>) => {
      state.bottomEditorRef.current = action.payload;
    },
    setEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.editorMode = action.payload;
    },
    setPromptModeIsAvailable: (state, action: PayloadAction<boolean>) => {
      state.promptModeIsAvailable = action.payload;
    },
    clearTopEditor: (state) => {
      state.topEditorRef.current?.setValue('');
      return state;
    },
    clearBottomEditor: (state) => {
      state.bottomEditorRef.current?.setValue('');
      return state;
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

      // TODO: Do i need to do these?
      //     editorRef.current?.updateOptions({ readOnly: false });
      //     editorRef.current?.focus();
    },
    setEditorText: (state, action: PayloadAction<string>) => {
      console.log(
        'REFS',
        state.topEditorRef.current?.getValue(),
        state.bottomEditorRef.current?.getValue()
      );
      if (state.editorMode === EditorMode.DualQuery) {
        state.bottomEditorRef.current?.setValue(action.payload);
      } else {
        state.topEditorRef.current?.setValue(action.payload);
      }
    },
  },
});

export const {
  setExecutionStatus,
  setTopEditorRef,
  setBottomEditorRef,
  setEditorMode,
  setPromptModeIsAvailable,
  clearTopEditor,
  clearBottomEditor,
  resetEditorMode,
  toggleDualEditorMode,
  setEditorText,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = queryEditorSlice.getInitialState();
