/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { EditorLanguage } from '../types';
import {
  selectQuery,
  selectQueryPrompt,
} from '../../../application/utils/state_management/selectors';

export function useEditorMode() {
  const query = useSelector(selectQuery);
  const prompt = useSelector(selectQueryPrompt);

  const [isDualEditor, setIsDualEditor] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [editorLanguageType, setEditorLanguageType] = useState(EditorLanguage.Natural); // Default to Natural

  // Automatically decide editor states based on presence of prompt/query
  useEffect(() => {
    const hasQuery = (query.query ?? '').trim().length > 0;
    const hasPrompt = (prompt ?? '').trim().length > 0;

    if (hasQuery && hasPrompt) {
      setIsDualEditor(true);
      setIsEditorReadOnly(false);
      setIsPromptReadOnly(true);
      setEditorLanguageType(EditorLanguage.PPL); // Set to PPL if both are present
    } else if (hasQuery) {
      setIsDualEditor(false);
      setIsEditorReadOnly(false);
      setIsPromptReadOnly(false);
      setEditorLanguageType(EditorLanguage.PPL);
    } else if (hasPrompt) {
      setIsDualEditor(false);
      setIsEditorReadOnly(true);
      setIsPromptReadOnly(false);
      setEditorLanguageType(EditorLanguage.Natural);
    } else {
      setIsDualEditor(false);
      setIsEditorReadOnly(false);
      setIsPromptReadOnly(false);
      setEditorLanguageType(EditorLanguage.Natural);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetEditorState = () => {
    setIsDualEditor(false);
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(false);
  };

  return {
    isDualEditor,
    isEditorReadOnly,
    isPromptReadOnly,
    editorLanguageType,
    query,
    prompt,
    setIsDualEditor,
    setIsEditorReadOnly,
    setIsPromptReadOnly,
    setEditorLanguageType,
    resetEditorState,
  };
}
