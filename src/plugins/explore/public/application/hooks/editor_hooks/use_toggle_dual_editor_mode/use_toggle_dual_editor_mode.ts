/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EditorContext } from '../../../context';
import { selectEditorMode } from '../../../utils/state_management/selectors';
import { AppDispatch } from '../../../utils/state_management/store';
import { EditorMode } from '../../../utils/state_management/types';
import { setEditorMode } from '../../../utils/state_management/slices';

/**
 * provides a function to toggle between dual editor modes
 */
export const useToggleDualEditorMode = () => {
  const { bottomEditorRef, topEditorRef } = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(() => {
    if (editorMode === EditorMode.DualPrompt) {
      dispatch(setEditorMode(EditorMode.DualQuery));
      // adding a timeout so that it runs after above dispatch
      setTimeout(() => {
        bottomEditorRef.current?.focus();
      });
    } else if (editorMode === EditorMode.DualQuery) {
      dispatch(setEditorMode(EditorMode.DualPrompt));
      // adding a timeout so that it runs after above dispatch
      setTimeout(() => {
        topEditorRef.current?.focus();
      });
    }
  }, [bottomEditorRef, dispatch, editorMode, topEditorRef]);
};
