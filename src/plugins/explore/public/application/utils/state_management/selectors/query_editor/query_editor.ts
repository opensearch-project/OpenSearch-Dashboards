/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { EditorMode, QueryExecutionStatus } from '../../types';

const selectState = (state: RootState) => state.queryEditor;

export const selectQueryStatus = createSelector([selectState], (state) => state.queryStatus);

export const selectExecutionStatus = createSelector(
  [selectState],
  (state) => state.queryStatus.status
);

export const selectIsLoading = createSelector(
  [selectState],
  (state) => state.queryStatus.status === QueryExecutionStatus.LOADING
);

export const selectPromptModeIsAvailable = createSelector(
  [selectState],
  (state) => state.promptModeIsAvailable
);

export const selectEditorMode = createSelector([selectState], (state) => state.editorMode);

export const selectIsDualEditorMode = createSelector([selectState], (state) =>
  [EditorMode.DualQuery, EditorMode.DualPrompt].includes(state.editorMode)
);
