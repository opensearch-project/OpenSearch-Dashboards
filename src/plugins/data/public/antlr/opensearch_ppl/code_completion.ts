/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, OpenSearchPplAutocompleteResult } from '../shared/types';
import {
  fetchColumnValues,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
  parseQuery,
} from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';
import { PPL_AGGREGATE_FUNCTIONS, PPL_SUGGESTION_IMPORTANCE } from './constants';

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs) => {
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
          insertText: af + '(${1:expr}) ',
          detail: SuggestionItemDetailsTags.AggregateFunction,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }))
      );
      // separately include count as there will be nothing within the parens
      finalSuggestions.push({
        text: `count()`,
        type: monaco.languages.CompletionItemKind.Function,
        insertText: 'count() ',
        detail: SuggestionItemDetailsTags.AggregateFunction,
      });
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
  } catch (e) {
    return [];
  }
};

export const getOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchPplAutocompleteResult => {
  return parseQuery({
    Lexer: openSearchPplAutocompleteData.Lexer,
    Parser: openSearchPplAutocompleteData.Parser,
    tokenDictionary: openSearchPplAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchPplAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchPplAutocompleteData.rulesToVisit,
    getParseTree: openSearchPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
