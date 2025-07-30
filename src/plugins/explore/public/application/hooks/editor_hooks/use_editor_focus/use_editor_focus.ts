/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useContext } from 'react';
import { EditorContext } from '../../../context';

/**
 * Focus related util hook
 */
export const useEditorFocus = () => {
  const editorRef = useContext(EditorContext);

  return useCallback(
    (selectAll?: boolean) => {
      // add a delay
      setTimeout(() => {
        const model = editorRef.current?.getModel();
        editorRef.current?.focus();
        if (selectAll && model) {
          editorRef.current?.setSelection(model.getFullModelRange());
        } else if (model) {
          // Position cursor at the end of the editor
          const lastLine = model.getLineCount();
          const lastColumn = model.getLineMaxColumn(lastLine);
          editorRef.current?.setPosition({ lineNumber: lastLine, column: lastColumn });
        }
      });
    },
    [editorRef]
  );
};
