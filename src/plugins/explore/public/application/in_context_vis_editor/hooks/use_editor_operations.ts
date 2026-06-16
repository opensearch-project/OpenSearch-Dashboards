/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import type { monaco } from '@osd/monaco';
import { EditorMode } from '../../utils/state_management/types';
import { useQueryBuilderState } from './use_query_builder_state';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useEditorOperations = () => {
  const { queryBuilder } = useQueryBuilderState();
  const getEditorRef = useCallback((): IStandaloneCodeEditor | null => {
    return queryBuilder.getEditorRef();
  }, [queryBuilder]);

  // Set editor ref
  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor | null) => {
      queryBuilder.setEditorRef(editor);
    },
    [queryBuilder]
  );

  // Focus editor
  const focusEditor = useCallback(
    (selectAll?: boolean) => {
      setTimeout(() => {
        const editor = getEditorRef();
        const model = editor?.getModel();
        editor?.focus();

        if (selectAll && model) {
          editor?.setSelection(model.getFullModelRange());
        } else if (model) {
          // Position cursor at the end
          const lastLine = model.getLineCount();
          const lastColumn = model.getLineMaxColumn(lastLine);
          editor?.setPosition({ lineNumber: lastLine, column: lastColumn });
        }
      });
    },
    [getEditorRef]
  );

  // Get editor text
  const getEditorText = useCallback((): string => {
    return getEditorRef()?.getValue() || '';
  }, [getEditorRef]);

  // Set editor text
  const setEditorText = useCallback(
    (text: string | ((prevText: string) => string)) => {
      const editor = getEditorRef();
      const currentValue = editor?.getValue() || '';
      const newValue = typeof text === 'function' ? text(currentValue) : text;
      editor?.setValue(newValue);
    },
    [getEditorRef]
  );

  // Switch editor mode (for language toggle)
  const switchEditorMode = useCallback(
    (mode: EditorMode) => {
      const editor = getEditorRef();
      queryBuilder.updateQueryEditorState({ editorMode: mode });
      const range = editor?.getModel()?.getFullModelRange();
      if (range) {
        setTimeout(() => editor?.setSelection(range), 300);
      }
    },
    [queryBuilder, getEditorRef]
  );

  const resetEditorMode = useCallback(() => {
    queryBuilder.updateQueryEditorState({ editorMode: EditorMode.Query });
  }, [queryBuilder]);

  const clearEditor = useCallback(() => {
    setEditorText('');
    resetEditorMode();
  }, [resetEditorMode, setEditorText]);

  return {
    getEditorRef,
    setEditorRef,
    focusEditor,
    getEditorText,
    setEditorText,
    switchEditorMode,
    clearEditor,
  };
};
