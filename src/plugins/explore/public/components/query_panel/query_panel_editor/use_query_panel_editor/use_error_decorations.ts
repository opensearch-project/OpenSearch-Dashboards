/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useEffect } from 'react';
import { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { selectOverallQueryStatus } from '../../../../application/utils/state_management/selectors';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorDecorationsCollection = monaco.editor.IEditorDecorationsCollection;

const PPL_FIELD_CONTEXTS = ['fields', 'where', 'stats by', 'sort by', 'rename', 'eval', 'parse'];

const findFieldInQuery = (
  model: monaco.editor.ITextModel,
  fieldName: string
): monaco.Range | null => {
  const matches = model.findMatches(
    fieldName,
    true,
    false,
    false, // PPL is case-insensitive for fields
    null,
    false
  );

  if (matches.length === 0) return null;

  const fullText = model.getValue().toLowerCase();
  for (const contextKeyword of PPL_FIELD_CONTEXTS) {
    const keywordIdx = fullText.indexOf(contextKeyword);
    if (keywordIdx === -1) continue;

    const keywordPos = model.getPositionAt(keywordIdx);
    const matchAfterKeyword = matches.find(
      (match) => match.range.startLineNumber >= keywordPos.lineNumber
    );

    if (matchAfterKeyword) {
      return matchAfterKeyword.range;
    }
  }

  return matches[0].range;
};

export const useErrorDecorations = () => {
  const collectionRef = useRef<IEditorDecorationsCollection | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const queryStatus = useSelector(selectOverallQueryStatus);

  useEffect(() => {
    return () => {
      if (collectionRef.current) {
        collectionRef.current.clear();
        collectionRef.current = null;
      }
      editorRef.current = null;
    };
  }, []);

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

      const hasError =
        queryStatus.status === QueryExecutionStatus.ERROR &&
        queryStatus.error?.errorBody?.error?.context;

      if (!hasError) {
        collection.clear();
        return;
      }

      const errorContext = queryStatus.error?.errorBody?.error?.context;
      const requestedField = errorContext?.requested_field;
      const errorDetails = queryStatus.error?.errorBody?.error?.details ?? 'Unknown error';

      if (!requestedField) {
        collection.clear();
        return;
      }

      const range = findFieldInQuery(model, requestedField);
      if (!range) {
        collection.clear();
        return;
      }

      collection.set([
        {
          range,
          options: {
            className: 'ppl-error-highlight',
            glyphMarginClassName: 'ppl-error-glyph',
            hoverMessage: {
              value: `**Query Error**\n\n${errorDetails}\n\nField: \`${requestedField}\``,
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
      ]);
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
