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
 * Context-sensitive sets the currently focused editor text
 */
export const useSetEditorText = () => {
  const { setBottomEditorText, setTopEditorText } = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);

  return useMemo(() => {
    if (editorMode === EditorMode.DualQuery) {
      return setBottomEditorText;
    }
    return setTopEditorText;
  }, [editorMode, setBottomEditorText, setTopEditorText]);
};
