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
 * Gives the query string from the editors
 */
export const useEditorQueryText = () => {
  const { bottomEditorText, topEditorText } = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);

  return useMemo(() => {
    if (editorMode === EditorMode.SingleQuery || editorMode === EditorMode.SingleEmpty) {
      return topEditorText;
    }

    return bottomEditorText;
  }, [editorMode, topEditorText, bottomEditorText]);
};
