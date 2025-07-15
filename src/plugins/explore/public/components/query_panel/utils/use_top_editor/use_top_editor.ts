/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo } from 'react';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import {
  selectEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { useSharedEditor } from '../use_shared_editor';
import { promptEditorOptions, queryEditorOptions } from '../editor_options';
import { UseEditorReturnType } from '../types';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { useEditorRefs, useTopEditorText } from '../../../../application/hooks';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useTopEditor = (): UseEditorReturnType => {
  const queryLanguage = useSelector(selectQueryLanguage);
  const editorMode = useSelector(selectEditorMode);
  const text = useTopEditorText();
  const { topEditorRef } = useEditorRefs();
  const isQueryMode = editorMode === EditorMode.SingleQuery;

  // The 'triggerSuggestOnFocus' prop of CodeEditor only happens on mount, so I am intentionally setting it false
  // and programmatically doing it here. We should only trigger autosuggestion on focus while on isQueryMode
  useEffect(() => {
    if (isQueryMode) {
      const onDidFocusDisposable = topEditorRef.current?.onDidFocusEditorWidget(() => {
        topEditorRef.current?.trigger('keyboard', 'editor.action.triggerSuggest', {});
      });

      return () => {
        onDidFocusDisposable?.dispose();
      };
    }
  }, [isQueryMode, topEditorRef]);

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      topEditorRef.current = editor;
    },
    [topEditorRef]
  );

  const sharedProps = useSharedEditor({ setEditorRef, editorPosition: 'top' });

  const options = useMemo(() => {
    if (isQueryMode) {
      return queryEditorOptions;
    } else {
      return promptEditorOptions;
    }
  }, [isQueryMode]);

  return {
    ...sharedProps,
    languageId: queryLanguage,
    options,
    triggerSuggestOnFocus: false,
    value: text,
  };
};
