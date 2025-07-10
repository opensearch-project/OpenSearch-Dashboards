/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';
import { selectEditorMode } from '../../../utils/state_management/selectors';

/**
 * Context-sensitive editor text
 */
export const useEditorText = () => {
  const { bottomEditorText, topEditorText } = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);

  return useMemo(() => {
    if (editorMode === EditorMode.DualQuery) {
      return bottomEditorText;
    }
    return topEditorText;
  }, [editorMode, bottomEditorText, topEditorText]);
};
