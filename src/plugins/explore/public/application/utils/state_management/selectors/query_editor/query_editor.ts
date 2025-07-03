/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { EditorMode, QueryExecutionStatus } from '../../types';

const selectState = (state: RootState) => state.queryEditor;

export const selectExecutionStatus = createSelector(
  [selectState],
  (state) => state.executionStatus
);

export const selectIsLoading = createSelector(
  [selectState],
  (state) => state.executionStatus === QueryExecutionStatus.LOADING
);

export const selectEditorMode = createSelector([selectState], (state) => state.editorMode);

export const selectCurrentEditorIsEmpty = createSelector([selectState], (state) => {
  const { editorMode, topEditorRef, bottomEditorRef } = state;

  console.log('EDITOR MODE', editorMode);
  console.log('BOTTOM', bottomEditorRef?.current?.getValue());
  console.log('TOP', topEditorRef?.current?.getValue());

  if (editorMode === EditorMode.DualQuery) {
    return !bottomEditorRef.current?.getValue().trim().length;
  } else {
    return !topEditorRef.current?.getValue().trim().length;
  }
});

export const selectIsDualEditorMode = createSelector([selectState], (state) =>
  [EditorMode.DualQuery, EditorMode.DualPrompt].includes(state.editorMode)
);
