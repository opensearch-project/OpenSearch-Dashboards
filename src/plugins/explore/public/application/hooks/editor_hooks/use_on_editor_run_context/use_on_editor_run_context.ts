/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo } from 'react';
import { EditorContext } from '../../../context';
import { useEditorPromptText } from '../use_editor_prompt_text';
import { useClearEditorsAndSetText } from '../use_clear_editors_and_set_text';
import { useEditorQueryText } from '../use_editor_query_text';

/**
 * Provides the editor context values needed for onEditorRunActionCreator
 */
export const useOnEditorRunContext = () => {
  const { setBottomEditorText } = useContext(EditorContext);
  const prompt = useEditorPromptText();
  const query = useEditorQueryText();
  const clearEditorsAndSetText = useClearEditorsAndSetText();

  return useMemo(() => ({ setBottomEditorText, prompt, query, clearEditorsAndSetText }), [
    setBottomEditorText,
    prompt,
    query,
    clearEditorsAndSetText,
  ]);
};
