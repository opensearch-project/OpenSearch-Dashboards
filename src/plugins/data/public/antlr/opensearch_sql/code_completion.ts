/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, OpenSearchSqlAutocompleteResult } from '../shared/types';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';
import { SQL_SYMBOLS } from './constants';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { fetchFieldSuggestions, parseQuery } from '../shared/utils';
import { SuggestionItemDetailsTags } from '../shared/constants';

export interface SuggestionParams {
  position: monaco.Position;
  query: string;
}

export interface ISuggestionItem {
  text: string;
  type: string;
  fieldType?: string;
}

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (!services || !services.appName || !indexPattern) return [];
  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: QuerySuggestion[] = [];

    // Fetch columns and values
    if (suggestions.suggestColumns?.tables?.length) {
      // NOTE:  currently the suggestions return the table present in the query, but since the
      //        parameters already provide that, it may not be needed anymore
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern));
    }

    // Fill in aggregate functions
    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...SQL_SYMBOLS.AGREGATE_FUNCTIONS.map((af) => ({
          text: af,
          type: monaco.languages.CompletionItemKind.Function,
          insertText: af,
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    // Fill in SQL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          insertText: sk.value,
          detail: SuggestionItemDetailsTags.Keyword,
        }))
      );
    }
    return finalSuggestions;
  } catch (error) {
    // TODO: Handle errors appropriately, possibly logging or displaying a message to the user
    return [];
  }
};

export const getOpenSearchSqlAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchSqlAutocompleteResult => {
  return parseQuery({
    Lexer: openSearchSqlAutocompleteData.Lexer,
    Parser: openSearchSqlAutocompleteData.Parser,
    tokenDictionary: openSearchSqlAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchSqlAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchSqlAutocompleteData.rulesToVisit,
    getParseTree: openSearchSqlAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchSqlAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
