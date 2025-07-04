/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { QueryTypeDetector } from './type_detection';
import { EditorLanguage } from './type_detection/constants';
import { EditorContextValue } from '../../../../../context';
import { selectPromptModeIsAvailable } from '../../../selectors';

export const onEditorChangeActionCreator = (text: string, editorContext: EditorContextValue) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const state = getState();
  const {
    queryEditor: { editorMode },
  } = state;
  const promptModeIsAvailable = selectPromptModeIsAvailable(state);

  editorContext.setEditorText(text);

  if (!promptModeIsAvailable) {
    return;
  }

  switch (editorMode) {
    case EditorMode.SingleQuery:
    case EditorMode.SinglePrompt: {
      const inferredLanguage = QueryTypeDetector.detect(text);

      // if you're on prompt mode but inferred is query, change to query
      if (editorMode === EditorMode.SinglePrompt && inferredLanguage.type === EditorLanguage.PPL) {
        dispatch(setEditorMode(EditorMode.SingleQuery));

        // if you're on query mode but inferred is prompt, change to prompt
      } else if (
        editorMode === EditorMode.SingleQuery &&
        inferredLanguage.type === EditorLanguage.Natural
      ) {
        dispatch(setEditorMode(EditorMode.SinglePrompt));
      }
    }
  }
};
