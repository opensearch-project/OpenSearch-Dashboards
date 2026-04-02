/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { selectOverallQueryStatus } from '../../../../application/utils/state_management/selectors';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorDecorationsCollection = monaco.editor.IEditorDecorationsCollection;
type IModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;

/**
 * Hook for managing error decorations in Monaco editor.
 * Highlights the position in the query where an error occurred based on error context.
 */
export const useErrorDecorations = () => {
  const collectionRef = useRef<IEditorDecorationsCollection | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const queryStatus = useSelector(selectOverallQueryStatus);

  const getCollection = useCallback(
    (editor: IStandaloneCodeEditor): IEditorDecorationsCollection => {
      if (editorRef.current !== editor || !collectionRef.current) {
        collectionRef.current = editor.createDecorationsCollection();
        editorRef.current = editor;
      }
      return collectionRef.current;
    },
    []
  );

  const updateErrorDecorations = useCallback(
    (editor: IStandaloneCodeEditor | null) => {
      if (!editor) return;

      const collection = getCollection(editor);
      const model = editor.getModel();
      if (!model) return;

      // Check if there's an error with position context
      if (
        queryStatus.status !== QueryExecutionStatus.ERROR ||
        !queryStatus.error?.errorBody?.error?.context?.query_pos
      ) {
        collection.clear();
        return;
      }

      const queryPos = queryStatus.error.errorBody.error.context.query_pos;
      const errorLine = queryPos.line || 1;
      const errorColumn = queryPos.column || 1;

      // Get the field name that caused the error for better context
      const requestedField = queryStatus.error.errorBody.error.context.requested_field;
      const errorDetails = queryStatus.error.errorBody.error.details;

      // NOTE: The backend returns positions for the TRANSFORMED query (with injected time filters, backticks, etc.)
      // so we can't use the column position directly. Instead, search for the field name in the original query.

      let line = errorLine;
      let startColumn = errorColumn;
      let endColumn = errorColumn + 1;

      if (requestedField) {
        // Search for the field name in the entire query text (case-sensitive)
        const fullText = model.getValue();
        const lines = fullText.split('\n');

        // Common PPL keywords that precede field names
        const fieldContexts = [
          'fields ',
          'where ',
          'stats by ',
          'sort by ',
          'rename ',
          'eval ',
          'parse ',
        ];

        // Find all occurrences of the field name
        let found = false;
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const lineText = lines[lineIdx];
          const lineNum = lineIdx + 1;

          // Look for the field after common keywords
          for (const context of fieldContexts) {
            const contextIdx = lineText.toLowerCase().indexOf(context);
            if (contextIdx !== -1) {
              // Search for field name after this keyword
              const searchStart = contextIdx + context.length;
              const fieldIdx = lineText.indexOf(requestedField, searchStart);

              if (fieldIdx !== -1) {
                // Make sure it's a word boundary (not part of a longer word)
                const charBefore = fieldIdx > 0 ? lineText[fieldIdx - 1] : ' ';
                const charAfter =
                  fieldIdx + requestedField.length < lineText.length
                    ? lineText[fieldIdx + requestedField.length]
                    : ' ';

                if (!/\w/.test(charBefore) && !/\w/.test(charAfter)) {
                  line = lineNum;
                  startColumn = fieldIdx + 1; // Monaco is 1-indexed
                  endColumn = startColumn + requestedField.length;
                  found = true;
                  break;
                }
              }
            }
          }

          if (found) break;

          // If not found in context, just find the first occurrence in this line
          if (!found) {
            const fieldIdx = lineText.indexOf(requestedField);
            if (fieldIdx !== -1) {
              const charBefore = fieldIdx > 0 ? lineText[fieldIdx - 1] : ' ';
              const charAfter =
                fieldIdx + requestedField.length < lineText.length
                  ? lineText[fieldIdx + requestedField.length]
                  : ' ';

              if (!/\w/.test(charBefore) && !/\w/.test(charAfter)) {
                line = lineNum;
                startColumn = fieldIdx + 1;
                endColumn = startColumn + requestedField.length;
                found = true;
                break;
              }
            }
          }
        }

        if (!found) {
          // Last resort: just use the first occurrence anywhere
          const fieldIdx = fullText.indexOf(requestedField);
          if (fieldIdx !== -1) {
            const position = model.getPositionAt(fieldIdx);
            line = position.lineNumber;
            startColumn = position.column;
            endColumn = startColumn + requestedField.length;
          }
        }
      } else {
        // No field name - try to find the word at the error position
        const lineContent = model.getLineContent(errorLine);
        const wordAtPos = model.getWordAtPosition({ lineNumber: errorLine, column: errorColumn });
        if (wordAtPos) {
          startColumn = wordAtPos.startColumn;
          endColumn = wordAtPos.endColumn;
        } else {
          endColumn = errorColumn + 5;
        }
      }

      const decorations: IModelDeltaDecoration[] = [
        {
          range: new monaco.Range(line, startColumn, line, endColumn),
          options: {
            className: 'ppl-error-highlight',
            glyphMarginClassName: 'ppl-error-glyph',
            hoverMessage: {
              value: `**Query Error**\n\n${errorDetails}${
                requestedField ? `\n\nField: \`${requestedField}\`` : ''
              }`,
            },
            minimap: {
              color: '#ff0000',
              position: monaco.editor.MinimapPosition.Inline,
            },
            overviewRuler: {
              color: '#ff0000',
              position: monaco.editor.OverviewRulerLane.Full,
            },
          },
        },
      ];

      collection.set(decorations);
    },
    [getCollection, queryStatus]
  );

  const clearErrorDecorations = useCallback(
    (editor: IStandaloneCodeEditor | null) => {
      if (!editor) return;
      const collection = getCollection(editor);
      collection.clear();
    },
    [getCollection]
  );

  return {
    updateErrorDecorations,
    clearErrorDecorations,
  };
};
