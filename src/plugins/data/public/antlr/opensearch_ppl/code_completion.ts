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

import { CursorPosition, AutocompleteResultBase } from '../shared/types';
import { parseQuery } from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion } from '../../autocomplete';

// Function to map token types to their names
const getTokenNameByType = (parser, type) => {
  return parser.vocabulary.getSymbolicName(type);
};

function getExistingTokenNames(tokenStream, lexer, cursorIndex) {
  tokenStream.seek(0); // Reset to start of the stream
  const existingTokens = new Set();
  while (tokenStream.index < cursorIndex) {
    const token = tokenStream.LT(1);
    if (token.type !== lexer.EOF) {
      const tokenName = lexer.symbolicNames[token.type];
      existingTokens.add(tokenName);
    }
    tokenStream.consume();
  }
  return existingTokens;
}

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  position,
  query,
  services,
}) => {
  try {
    const { api } = services.uiSettings;
    const dataSetManager = services.data.query.dataSetManager;
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPplAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: QuerySuggestion[] = [];
    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
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
