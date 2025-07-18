/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { EditorMode, QueryExecutionStatus } from '../../types';

const selectState = (state: RootState) => state.queryEditor;

export const selectQueryStatusMap = createSelector([selectState], (state) => state.queryStatusMap);

export const selectQueryStatusMapByKey = createSelector(
  [selectQueryStatusMap, (_, cacheKey: string) => cacheKey],
  (statusMap, cacheKey) => statusMap[cacheKey]
);

export const selectOverallQueryStatus = createSelector(
  [selectState],
  (state) => state.overallQueryStatus
);

export const selectQueryStatus = selectOverallQueryStatus;

export const selectExecutionStatus = createSelector(
  [selectOverallQueryStatus],
  (overallStatus) => overallStatus.status
);

export const selectIsLoading = createSelector(
  [selectOverallQueryStatus],
  (overallStatus) => overallStatus.status === QueryExecutionStatus.LOADING
);

export const selectPromptModeIsAvailable = createSelector(
  [selectState],
  (state) => state.promptModeIsAvailable
);

export const selectPromptToQueryIsLoading = createSelector(
  [selectState],
  (state) => state.promptToQueryIsLoading
);

export const selectSummaryAgentIsAvailable = createSelector(
  [selectState],
  (state) => state.summaryAgentIsAvailable
);

export const selectEditorMode = createSelector([selectState], (state) => state.editorMode);

export const selectIsPromptEditorMode = createSelector([selectEditorMode], (editorMode) => {
  return editorMode === EditorMode.Prompt;
});

export const selectLastExecutedPrompt = createSelector(
  [selectState],
  (state) => state.lastExecutedPrompt
);

export const selectLastExecutedTranslatedQuery = createSelector(
  [selectState],
  (state) => state.lastExecutedTranslatedQuery
);
