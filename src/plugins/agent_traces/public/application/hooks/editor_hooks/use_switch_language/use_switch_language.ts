/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { EditorMode } from '../../../utils/state_management/types';
import { setEditorMode } from '../../../utils/state_management/slices';
import { useEditorRef } from '../use_editor_ref';

export const useSwitchLanguage = (): ((mode: EditorMode) => void) => {
  const dispatch = useDispatch();
  const editorRef = useEditorRef();

  const switchEditorMode = useCallback(
    (mode: EditorMode) => {
      dispatch(setEditorMode(mode));
      // select all
      const range = editorRef.current?.getModel()?.getFullModelRange();
      if (range) {
        setTimeout(() => editorRef.current?.setSelection(range), 300);
      }
    },
    [dispatch, editorRef]
  );

  return switchEditorMode;
};
