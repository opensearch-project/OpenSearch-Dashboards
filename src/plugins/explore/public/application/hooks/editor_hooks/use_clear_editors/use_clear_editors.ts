/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Clears both editors
 */
export const useClearEditors = () => {
  const { setTopEditorText, setBottomEditorText } = useContext(EditorContext);

  return useCallback(() => {
    setBottomEditorText('');
    setTopEditorText('');
  }, [setBottomEditorText, setTopEditorText]);
};
