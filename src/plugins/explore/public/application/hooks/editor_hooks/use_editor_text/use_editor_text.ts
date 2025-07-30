/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives a callback to get editor text. Callback is used to avoid staleness
 */
export const useEditorText = () => {
  const editorRef = useContext(EditorContext);

  return useCallback(() => {
    return editorRef.current?.getValue() || '';
  }, [editorRef]);
};
