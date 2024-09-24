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
import { CursorPosition, AutocompleteResultBase } from '../shared/types';
import { fetchFieldSuggestions, parseQuery } from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';

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
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern));
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: SuggestionItemDetailsTags.Keyword,
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
): AutocompleteResultBase => {
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
