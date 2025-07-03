/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { selectQueryLanguage } from '../../../../application/utils/state_management/selectors';
import { useSharedEditor } from '../use_shared_editor';
import { setBottomEditorRef } from '../../../../application/utils/state_management/slices';
import { queryEditorOptions } from '../editor_options';
import { UseEditorReturnType } from '../types';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useBottomEditor = (): UseEditorReturnType => {
  const dispatch = useDispatch();
  const queryLanguage = useSelector(selectQueryLanguage);

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      dispatch(setBottomEditorRef(editor));
    },
    [dispatch]
  );

  const sharedProps = useSharedEditor({ setEditorRef });

  return {
    ...sharedProps,
    languageId: queryLanguage,
    options: queryEditorOptions,
    triggerSuggestOnFocus: false,
  };
};
