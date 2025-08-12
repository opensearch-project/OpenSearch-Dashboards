/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SetStateAction, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSetEditorText } from '../use_set_editor_text';
import { setEditorMode } from '../../../utils/state_management/slices';
import { EditorMode } from '../../../utils/state_management/types';

/**
 * sets editor text to the provided query
 */
export const useSetEditorTextWithQuery = () => {
  const setEditorText = useSetEditorText();
  const dispatch = useDispatch();

  return useCallback(
    (textOrCallback: SetStateAction<string>) => {
      setEditorText(textOrCallback);
      dispatch(setEditorMode(EditorMode.Query));
    },
    [dispatch, setEditorText]
  );
};
