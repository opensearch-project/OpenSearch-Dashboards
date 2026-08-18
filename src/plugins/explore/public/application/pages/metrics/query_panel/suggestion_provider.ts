/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { DEFAULT_DATA } from '../../../../../../data/common';
import {
  IDataPluginServices,
  MonacoCompatibleQuerySuggestion,
} from '../../../../../../data/public';
import { ExploreServices } from '../../../../types';

// Interval macros resolved by the PromQL search interceptor before the query is sent.
const PROMQL_MACROS: Array<{ label: string; detail: string }> = [
  {
    label: '$__rate_interval',
    detail: 'Rate window sized to the step + scrape interval (use inside rate()).',
  },
  { label: '$__interval', detail: 'Resolved step for the current time range.' },
  { label: '$__interval_ms', detail: 'Resolved step in milliseconds.' },
  { label: '$__range', detail: 'Current time range as a duration.' },
  { label: '$__range_s', detail: 'Current time range in seconds.' },
  { label: '$__range_ms', detail: 'Current time range in milliseconds.' },
];

export function createPromQLSuggestionProvider(
  services: ExploreServices
): monaco.languages.CompletionItemProvider {
  const {
    data: { dataViews, query: queryService, autocomplete },
  } = services;
  return {
    triggerCharacters: [' ', '(', '{', '[', ',', '=', '~', '"', "'", '$'],
    provideCompletionItems: async (model, position, _, token) => {
      if (token.isCancellationRequested) return { suggestions: [], incomplete: false };
      try {
        const currentDataset = queryService.queryString.getQuery().dataset;
        if (!currentDataset?.id) return { suggestions: [], incomplete: false };
        const currentDataView = await dataViews.get(
          currentDataset.id,
          currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
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
          datasetType: currentDataset.type,
          position,
          // ExploreServices storage type incompatible with IDataPluginServices.DataStorage
          services: services as unknown as IDataPluginServices,
        });
        const wordUntil = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        // Monaco's word detection stops at "$", so build a range that spans the
        // "$__…" token and offer the interval macros whenever one is being typed.
        const lineContent = model.getLineContent(position.lineNumber);
        let macroStartCol = position.column;
        while (macroStartCol > 1 && /[$_a-zA-Z]/.test(lineContent[macroStartCol - 2])) {
          macroStartCol--;
        }
        const macroPrefix = lineContent.substring(macroStartCol - 1, position.column - 1);
        const macroSuggestions = macroPrefix.startsWith('$')
          ? PROMQL_MACROS.map((m) => ({
              label: m.label,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: m.label,
              filterText: m.label,
              range: new monaco.Range(
                position.lineNumber,
                macroStartCol,
                position.lineNumber,
                position.column
              ),
              detail: m.detail,
              sortText: '0',
              documentation: '',
            }))
          : [];

        const monacoSuggestions = (suggestions || []).filter(
          (s): s is MonacoCompatibleQuerySuggestion => 'detail' in s
        );
        return {
          suggestions: [
            ...macroSuggestions,
            ...monacoSuggestions.map((s) => ({
              label: s.text,
              kind: s.type as monaco.languages.CompletionItemKind,
              insertText: s.insertText ?? s.text,
              insertTextRules: s.insertTextRules ?? undefined,
              range,
              detail: s.detail,
              sortText: s.sortText,
              documentation: s.documentation ? { value: s.documentation } : '',
              command: { id: 'editor.action.triggerSuggest', title: 'Trigger Next Suggestion' },
            })),
          ],
          incomplete: false,
        };
      } catch {
        return { suggestions: [], incomplete: false };
      }
    },
  };
}
