/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * setEditorText hook
 */
export const useSetEditorText = () => {
  const editorRef = useContext(EditorContext);

  return useCallback(
    (text: string | ((prevText: string) => string)) => {
      const currentValue = editorRef.current?.getValue() || '';
      const newValue = typeof text === 'function' ? text(currentValue) : text;
      editorRef.current?.setValue(newValue);
    },
    [editorRef]
  );
};
