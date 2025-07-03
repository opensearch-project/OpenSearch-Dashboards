/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  selectQuery,
  selectQueryPrompt,
} from '../../../../application/utils/state_management/selectors';
import { EditorLanguage, EditorMode } from '../../types';
import { usePromptModeIsAvailable } from './use_prompt_mode_is_available';

export const useEditorModeLocalState = () => {
  const promptModeIsAvailable = usePromptModeIsAvailable();
  const query = useSelector(selectQuery);
  const prompt = useSelector(selectQueryPrompt);

  // TODO: query.query is also typed as object. Why?
  const [localQuery, setLocalQuery] = useState<string>(query.query as string);
  const [localPrompt, setLocalPrompt] = useState<string>(prompt ?? '');

  const [editorMode, setEditorMode] = useState<EditorMode>(EditorMode.SinglePrompt);

  useEffect(() => {
    if (!promptModeIsAvailable) {
      setEditorMode(EditorMode.SingleQuery);
      return;
    }

    const hasQuery = (query.query ?? '').trim().length > 0;
    const hasPrompt = (prompt ?? '').trim().length > 0;

    if (hasQuery && hasPrompt) {
      setEditorMode(EditorMode.DualQuery);
    } else if (hasQuery) {
      setEditorMode(EditorMode.SingleQuery);
    } else if (hasPrompt) {
      setEditorMode(EditorMode.SinglePrompt);
    } else {
      setEditorMode(EditorMode.SinglePrompt);
    }
  }, [prompt, query.query, promptModeIsAvailable]);

  const resetEditorState = useCallback(() => {
    setEditorMode(promptModeIsAvailable ? EditorMode.SinglePrompt : EditorMode.SingleQuery);
  }, [promptModeIsAvailable]);

  const setEditorLanguage = useCallback(
    (language: EditorLanguage) => {
      setEditorMode(getEditorModeInSameUiMode(editorMode, language));
    },
    [editorMode]
  );

  return {
    localPrompt,
    localQuery,
    promptModeIsAvailable,
    editorMode,
    setEditorLanguage,
    resetEditorState,
    setLocalQuery,
    setLocalPrompt,
  };
};

export const getEditorModeInSameUiMode = (
  currentEditorMode: EditorMode,
  language: EditorLanguage
): EditorMode => {
  if (![EditorLanguage.PPL, EditorLanguage.Natural].includes(language)) {
    throw new Error(`getEditorModeInSameUiMode encountered unsupported language: ${language}`);
  }

  if ([EditorMode.SinglePrompt, EditorMode.SingleQuery].includes(currentEditorMode)) {
    if (language === EditorLanguage.Natural) {
      return EditorMode.SinglePrompt;
    } else {
      return EditorMode.SingleQuery;
    }
  } else if ([EditorMode.DualPrompt, EditorMode.DualQuery].includes(currentEditorMode)) {
    if (language === EditorLanguage.Natural) {
      return EditorMode.DualPrompt;
    } else {
      return EditorMode.DualQuery;
    }
  } else {
    throw new Error(
      `getEditorModeInSameUiMode encountered unsupported editor mode: ${currentEditorMode}`
    );
  }
};
