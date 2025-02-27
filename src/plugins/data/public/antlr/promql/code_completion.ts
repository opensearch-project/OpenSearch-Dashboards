/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, PromQLAutocompleteResult } from '../shared/types';
import { openSearchPromQLAutocompleteData } from './promql_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { parseQuery } from '../shared/utils';
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
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (!services || !services.appName || !indexPattern) return [];
  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPromQLAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: QuerySuggestion[] = [];

    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${sk.value}`,
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

export const getOpenSearchPromQLAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): PromQLAutocompleteResult => {
  return parseQuery({
    Lexer: openSearchPromQLAutocompleteData.Lexer,
    Parser: openSearchPromQLAutocompleteData.Parser,
    tokenDictionary: openSearchPromQLAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchPromQLAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchPromQLAutocompleteData.rulesToVisit,
    getParseTree: openSearchPromQLAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchPromQLAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
