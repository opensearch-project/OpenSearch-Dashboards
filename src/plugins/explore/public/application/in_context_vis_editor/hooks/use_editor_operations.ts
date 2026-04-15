/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import type { monaco } from '@osd/monaco';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

interface EditorAccessors {
  getEditor: () => IStandaloneCodeEditor | null;
  setEditor: (editor: IStandaloneCodeEditor | null) => void;
}

export const useEditorOperations = ({ getEditor, setEditor }: EditorAccessors) => {
  const getEditorRef = useCallback(() => getEditor(), [getEditor]);

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor | null) => {
      setEditor(editor);
    },
    [setEditor]
  );

  const focusEditor = useCallback(
    (selectAll?: boolean) => {
      setTimeout(() => {
        const editor = getEditor();
        const model = editor?.getModel();
        editor?.focus();

        if (selectAll && model) {
          editor?.setSelection(model.getFullModelRange());
        } else if (model) {
          const lastLine = model.getLineCount();
          const lastColumn = model.getLineMaxColumn(lastLine);
          editor?.setPosition({ lineNumber: lastLine, column: lastColumn });
        }
      });
    },
    [getEditor]
  );

  const getEditorText = useCallback((): string => {
    return getEditor()?.getValue() || '';
  }, [getEditor]);

  const setEditorText = useCallback(
    (text: string | ((prevText: string) => string)) => {
      const editor = getEditor();
      const currentValue = editor?.getValue() || '';
      const newValue = typeof text === 'function' ? text(currentValue) : text;
      editor?.setValue(newValue);
    },
    [getEditor]
  );

  const switchEditorMode = useCallback(() => {
    const range = getEditor()?.getModel()?.getFullModelRange();
    if (range) {
      setTimeout(() => getEditor()?.setSelection(range), 300);
    }
  }, [getEditor]);

  const clearEditor = useCallback(() => {
    setEditorText('');
  }, [setEditorText]);

  return {
    focusEditor,
    getEditorText,
    setEditorText,
    clearEditor,
    getEditorRef,
    setEditorRef,
    switchEditorMode,
  };
};
