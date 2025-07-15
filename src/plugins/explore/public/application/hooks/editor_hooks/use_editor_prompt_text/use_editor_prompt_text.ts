/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectEditorMode } from '../../../utils/state_management/selectors';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';

/**
 * Gives the prompt string from the editors
 */
export const useEditorPromptText = () => {
  const { topEditorText } = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);

  return useMemo(() => {
    if (editorMode === EditorMode.SingleQuery) {
      return '';
    }

    return topEditorText;
  }, [editorMode, topEditorText]);
};
