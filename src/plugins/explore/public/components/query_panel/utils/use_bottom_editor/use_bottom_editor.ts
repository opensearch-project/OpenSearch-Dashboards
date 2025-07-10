/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { selectQueryLanguage } from '../../../../application/utils/state_management/selectors';
import { useSharedEditor } from '../use_shared_editor';
import { queryEditorOptions } from '../editor_options';
import { UseEditorReturnType } from '../types';
import { useBottomEditorText, useEditorRefs } from '../../../../application/hooks';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useBottomEditor = (): UseEditorReturnType => {
  const queryLanguage = useSelector(selectQueryLanguage);
  const text = useBottomEditorText();
  const { bottomEditorRef } = useEditorRefs();

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      bottomEditorRef.current = editor;
    },
    [bottomEditorRef]
  );

  const sharedProps = useSharedEditor({ setEditorRef, editorPosition: 'bottom' });

  return {
    ...sharedProps,
    languageId: queryLanguage,
    options: queryEditorOptions,
    triggerSuggestOnFocus: true,
    value: text,
  };
};
