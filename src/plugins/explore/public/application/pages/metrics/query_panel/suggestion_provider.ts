/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { DEFAULT_DATA } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';

export function createPromQLSuggestionProvider(
  services: ExploreServices
): monaco.languages.CompletionItemProvider {
  const {
    data: { dataViews, query: queryService, autocomplete },
  } = services;
  return {
    triggerCharacters: [' ', '(', '{', '[', ',', '=', '~', '"', "'"],
    provideCompletionItems: async (model, position, _, token) => {
      if (token.isCancellationRequested) return { suggestions: [], incomplete: false };
      try {
        const currentDataset = queryService.queryString.getQuery().dataset;
        const currentDataView = await dataViews.get(
          currentDataset?.id!,
          currentDataset?.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );
        const text = model.getValue();
        const offset = model.getOffsetAt(position);
        const suggestions = await autocomplete?.getQuerySuggestions({
          query: text,
          selectionStart: offset,
          selectionEnd: offset,
          language: 'PROMQL',
          baseLanguage: 'PROMQL',
          indexPattern: currentDataView,
          datasetType: currentDataset?.type,
          position,
          services: services as any,
        });
        const wordUntil = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );
        return {
          suggestions: (suggestions?.filter((s: any) => 'detail' in s) || []).map((s: any) => ({
            label: s.text,
            kind: s.type as monaco.languages.CompletionItemKind,
            insertText: s.insertText ?? s.text,
            insertTextRules: s.insertTextRules ?? undefined,
            range,
            detail: s.detail,
            sortText: s.sortText,
            documentation: s.documentation ? { value: s.documentation, isTrusted: true } : '',
            command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
          })),
          incomplete: false,
        };
      } catch {
        return { suggestions: [], incomplete: false };
      }
    },
  };
}
