/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { monaco } from '@osd/monaco';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorDecorationsCollection = monaco.editor.IEditorDecorationsCollection;

/**
 * Hook for managing multi-query gutter decorations in Monaco editor.
 * Uses Monaco's createDecorationsCollection API for automatic cleanup on model changes.
 */
export const useMultiQueryDecorations = () => {
  const collectionRef = useRef<IEditorDecorationsCollection | null>(null);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);

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

  const updateDecorations = useCallback(
    (editor: IStandaloneCodeEditor | null, _language: string) => {
      if (!editor) return;

      const collection = getCollection(editor);

      collection.clear();
    },
    [getCollection]
  );

  const clearDecorations = useCallback(
    (editor: IStandaloneCodeEditor | null) => {
      if (!editor) return;
      const collection = getCollection(editor);
      collection.clear();
    },
    [getCollection]
  );

  return {
    updateDecorations,
    clearDecorations,
  };
};
