/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import {
  selectEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { useSharedEditor } from '../use_shared_editor';
import { promptEditorOptions, queryEditorOptions } from '../editor_options';
import { UseEditorReturnType } from '../types';
import { useEditorContextByEditorComponent } from '../../../../application/context';
import { EditorMode } from '../../../../application/utils/state_management/types';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useTopEditor = (): UseEditorReturnType => {
  const queryLanguage = useSelector(selectQueryLanguage);
  const editorMode = useSelector(selectEditorMode);
  const { topEditorText, topEditorRef } = useEditorContextByEditorComponent();

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      topEditorRef.current = editor;
    },
    [topEditorRef]
  );

  const sharedProps = useSharedEditor({ setEditorRef, editorPosition: 'top' });

  const options = useMemo(() => {
    if (
      [EditorMode.SingleEmpty, EditorMode.SinglePrompt, EditorMode.DualPrompt].includes(editorMode)
    ) {
      return promptEditorOptions;
    }

    return queryEditorOptions;
  }, [editorMode]);

  return {
    ...sharedProps,
    languageId: queryLanguage,
    options,
    triggerSuggestOnFocus: editorMode === EditorMode.SingleQuery,
    value: topEditorText,
  };
};
