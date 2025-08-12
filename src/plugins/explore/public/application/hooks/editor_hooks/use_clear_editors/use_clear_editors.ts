/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { resetEditorMode } from '../../../utils/state_management/slices';
import { useSetEditorText } from '../use_set_editor_text';

/**
 * Clear editors
 */
export const useClearEditors = () => {
  const setEditorText = useSetEditorText();
  const dispatch = useDispatch();

  return useCallback(() => {
    setEditorText('');
    dispatch(resetEditorMode());
  }, [dispatch, setEditorText]);
};
