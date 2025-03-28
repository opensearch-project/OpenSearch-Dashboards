/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import {
  QuerySuggestion,
  QuerySuggestionGetFn,
  QuerySuggestionGetFnArgs,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
  fetchColumnValues,
  SuggestionItemDetailsTags,
  PPL_AGGREGATE_FUNCTIONS,
  PPL_SUGGESTION_IMPORTANCE,
  getOpenSearchPplAutoCompleteSuggestions,
} from '../../../data/public';

/**
 * PPL query suggestion provider
 *
 * This implementation uses the sophisticated ANTLR-based parser from the data plugin
 * to provide context-aware suggestions based on the cursor position in the query.
 */
export const getPPLSuggestions: QuerySuggestionGetFn = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (!services || !services.appName || !indexPattern) return [];

  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPplAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: QuerySuggestion[] = [];

    if (suggestions.suggestColumns) {
      finalSuggestions.push(...formatFieldsToSuggestions(indexPattern, (f: any) => `${f} `, '3'));
    }

    if (suggestions.suggestValuesForColumn) {
      finalSuggestions.push(
        ...formatValuesToSuggestions(
          await fetchColumnValues(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern.fields.find((field) => field.name === suggestions.suggestValuesForColumn),
            datasetType
          ).catch(() => []),
          (val: any) => (typeof val === 'string' ? `"${val}" ` : `${val} `)
        )
      );
    }

    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...PPL_AGGREGATE_FUNCTIONS.map((af) => ({
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Function,
          insertText: af + ' ',
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    if (suggestions.suggestSourcesOrTables) {
      finalSuggestions.push({
        text: indexPattern.title,
        type: monaco.languages.CompletionItemKind.Struct,
        insertText: `${indexPattern.title} `,
        detail: SuggestionItemDetailsTags.Table,
      });
    }

    if (suggestions.suggestRenameAs) {
      finalSuggestions.push({
        text: 'as',
        insertText: 'as ',
        type: monaco.languages.CompletionItemKind.Keyword,
        detail: SuggestionItemDetailsTags.Keyword,
      });
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value.toLowerCase(),
          insertText: `${sk.value.toLowerCase()} `,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: SuggestionItemDetailsTags.Keyword,
          // sortText is the only option to sort suggestions, compares strings
          sortText: PPL_SUGGESTION_IMPORTANCE.get(sk.id) ?? '9' + sk.value.toLowerCase(), // '9' used to devalue every other suggestion
        }))
      );
    }

    return finalSuggestions;
  } catch (error) {
    // Handle error silently
    return [];
  }
};
