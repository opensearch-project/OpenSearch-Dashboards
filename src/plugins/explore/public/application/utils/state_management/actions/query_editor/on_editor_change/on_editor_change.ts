/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { QueryTypeDetector } from './type_detection';
import { EditorLanguage } from './type_detection/constants';
import { selectPromptModeIsAvailable } from '../../../selectors';
import { useSetEditorText } from '../../../../../hooks';

export const onEditorChangeActionCreator = (
  text: string,
  setEditorText: ReturnType<typeof useSetEditorText>
) => (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  const {
    queryEditor: { editorMode },
  } = state;
  const promptModeIsAvailable = selectPromptModeIsAvailable(state);

  setEditorText(text);

  if (!promptModeIsAvailable) {
    // change to Query mode if in singlePrompt mode
    if (editorMode !== EditorMode.SingleQuery) {
      dispatch(setEditorMode(EditorMode.SingleQuery));
    }

    return;
  }

  if (text.trim().length === 0 && editorMode !== EditorMode.SingleEmpty) {
    dispatch(setEditorMode(EditorMode.SingleEmpty));
    return;
  }

  switch (editorMode) {
    case EditorMode.SingleEmpty:
    case EditorMode.SingleQuery:
    case EditorMode.SinglePrompt: {
      const inferredLanguage = QueryTypeDetector.detect(text);

      // if you're on prompt mode (or empty) but inferred is query, change to query
      if (
        [EditorMode.SingleEmpty, EditorMode.SinglePrompt].includes(editorMode) &&
        inferredLanguage.type === EditorLanguage.PPL
      ) {
        dispatch(setEditorMode(EditorMode.SingleQuery));

        // if you're on query mode (or empty) but inferred is prompt, change to prompt
      } else if (
        [EditorMode.SingleEmpty, EditorMode.SingleQuery].includes(editorMode) &&
        inferredLanguage.type === EditorLanguage.Natural
      ) {
        dispatch(setEditorMode(EditorMode.SinglePrompt));
      }
      break;
    }
  }
};
