/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext, useMemo } from 'react';
import { EditorContext } from '../../../context';

/**
 * Focus related util hook
 */
export const useEditorFocus = () => {
  const { editorRef, editorIsFocused, setEditorIsFocused } = useContext(EditorContext);

  const focusOnEditor = useCallback(() => {
    setEditorIsFocused(true);
    // add a delay
    setTimeout(() => editorRef.current?.focus());
  }, [editorRef, setEditorIsFocused]);

  return useMemo(() => ({ editorIsFocused, focusOnEditor, setEditorIsFocused }), [
    editorIsFocused,
    focusOnEditor,
    setEditorIsFocused,
  ]);
};
