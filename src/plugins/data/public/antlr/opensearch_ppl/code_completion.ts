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
import { fetchColumnValues, fetchFieldSuggestions, parseQuery } from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';
import { PPL_AGGREGATE_FUNCTIONS } from './constants';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
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
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern, (f: any) => `${f} `));
    }

    if (suggestions.suggestValuesForColumn) {
      // take the column and push in values for that column
      const res = await fetchColumnValues(
        [indexPattern.title],
        suggestions.suggestValuesForColumn,
        services.http
      );

      let i = 0;
      finalSuggestions.push(
        ...res.body.fields[0].values.map((val: string) => {
          i++;
          return {
            text: val,
            insertText: `"${val}" `,
            type: monaco.languages.CompletionItemKind.Value,
            detail: SuggestionItemDetailsTags.Value,
            sortText: i.toString().padStart(3, '0'),
          };
        })
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

    // create the keyword sortlist
    const suggestionImportance = new Map<number, string>();
    suggestionImportance.set(OpenSearchPPLParser.PIPE, '0');
    suggestionImportance.set(OpenSearchPPLParser.COMMA, '1');
    suggestionImportance.set(OpenSearchPPLParser.PLUS, '2');
    suggestionImportance.set(OpenSearchPPLParser.MINUS, '2');
    suggestionImportance.set(OpenSearchPPLParser.EQUAL, '2');
    suggestionImportance.set(OpenSearchPPLParser.SOURCE, '2');

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value.toLowerCase(),
          insertText: `${sk.value.toLowerCase()} `,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: SuggestionItemDetailsTags.Keyword,
          sortText: suggestionImportance.get(sk.id) ?? sk.value.toLowerCase(),
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
