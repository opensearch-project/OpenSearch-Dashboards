/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';
import { monaco } from '@osd/monaco';
import {
  splitMultiQueries,
  ParsedQueryWithPosition,
} from '../../../../application/utils/multi_query_utils';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type IEditorDecorationsCollection = monaco.editor.IEditorDecorationsCollection;
type IModelDeltaDecoration = monaco.editor.IModelDeltaDecoration;

/**
 * Manages dynamic CSS rules for glyph margin labels.
 * Uses a stylesheet with individual rules that can be added/removed.
 */
class GlyphLabelStyleManager {
  private styleElement: HTMLStyleElement | null = null;
  private rules = new Map<string, number>(); // label -> rule index

  private getStyleSheet(): CSSStyleSheet | null {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'query-label-dynamic-styles';
      document.head.appendChild(this.styleElement);
    }
    return this.styleElement.sheet;
  }

  labelToClassName(label: string): string {
    return label.replace(/,/g, '_').replace(/\./g, 'x');
  }

  ensureRule(label: string): void {
    if (this.rules.has(label)) return;

    const sheet = this.getStyleSheet();
    if (!sheet) return;

    const className = this.labelToClassName(label);
    const rule = `.query-label-gutter--${className}::before { content: "${label}"; }`;
    const index = sheet.insertRule(rule, sheet.cssRules.length);
    this.rules.set(label, index);
  }

  cleanup(): void {
    if (this.styleElement?.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.styleElement = null;
    this.rules.clear();
  }
}

// Singleton instance - shared across all hook instances
const styleManager = new GlyphLabelStyleManager();

/**
 * Hook for managing multi-query gutter decorations in Monaco editor.
 * Displays labels (A, B, C, ...) in the gutter for each query segment.
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
    (editor: IStandaloneCodeEditor | null, language: string) => {
      if (!editor) return;

      const collection = getCollection(editor);

      if (language !== 'PROMQL') {
        collection.clear();
        return;
      }

      const model = editor.getModel();
      if (!model) return;

      const text = model.getValue();
      const queries = splitMultiQueries(text);

      if (queries.length <= 1) {
        collection.clear();
        return;
      }

      const queriesByLine = new Map<number, ParsedQueryWithPosition[]>();
      for (const query of queries) {
        const lineNum = query.startLine + 1; // Monaco lines are 1-indexed
        if (!queriesByLine.has(lineNum)) {
          queriesByLine.set(lineNum, []);
        }
        queriesByLine.get(lineNum)!.push(query);
      }

      const decorations: IModelDeltaDecoration[] = [];
      queriesByLine.forEach((lineQueries, lineNum) => {
        const labels = lineQueries.map((q) => q.label);
        const fullLabel = labels.join(',');
        // Truncate to "A,B" for 2 queries, or "A.." for 3+ queries
        const displayLabel = labels.length <= 2 ? fullLabel : `${labels[0]}..`;
        const hoverText = labels.length > 1 ? `Queries ${fullLabel}` : `Query ${labels[0]}`;

        styleManager.ensureRule(displayLabel);

        const className = styleManager.labelToClassName(displayLabel);

        decorations.push({
          range: new monaco.Range(lineNum, 1, lineNum, 1),
          options: {
            glyphMarginClassName: `query-label-gutter query-label-gutter--${className}`,
            glyphMarginHoverMessage: { value: hoverText },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      });

      collection.set(decorations);
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
