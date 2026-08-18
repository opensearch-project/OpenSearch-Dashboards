/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

export interface SetEditorTextOptions {
  preserveUndo?: boolean;
}

/**
 * setEditorText hook
 */
export const useSetEditorText = () => {
  const editorRef = useContext(EditorContext);

  return useCallback(
    (text: string | ((prevText: string) => string), options?: SetEditorTextOptions) => {
      const editor = editorRef.current;
      const currentValue = editor?.getValue() || '';
      const newValue = typeof text === 'function' ? text(currentValue) : text;

      if (options?.preserveUndo) {
        const model = editor?.getModel();
        if (editor && model) {
          editor.pushUndoStop();
          const applied = editor.executeEdits('explore.setEditorText', [
            {
              range: model.getFullModelRange(),
              text: newValue,
              forceMoveMarkers: true,
            },
          ]);
          editor.pushUndoStop();
          if (applied) {
            return;
          }
        }
      }

      editor?.setValue(newValue);
    },
    [editorRef]
  );
};
