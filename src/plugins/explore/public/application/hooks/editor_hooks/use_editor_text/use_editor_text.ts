/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Gives editor text
 */
export const useEditorText = () => {
  const editorRef = useContext(EditorContext);

  return editorRef.current?.getValue() || '';
};
