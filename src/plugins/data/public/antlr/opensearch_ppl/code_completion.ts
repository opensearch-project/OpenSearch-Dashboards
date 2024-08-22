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
import { parseQuery } from '../shared/utils';
import { openSearchPplAutocompleteData } from './opensearch_ppl_autocomplete';
import { QuerySuggestion } from '../../autocomplete';
import { IndexPattern, IndexPatternField } from '../../index_patterns';

const fetchFieldSuggestions = (
  indexPattern: IndexPattern
): Array<{
  text: string;
  type: monaco.languages.CompletionItemKind;
  insertText: string;
  detail: string;
}> => {
  const fieldNames: string[] = indexPattern.fields
    .filter((idxField: IndexPatternField) => !idxField?.subType) // filter removed .keyword fields
    .map((idxField: { name: string }) => {
      return idxField.name;
    });

  const fieldSuggestions: Array<{
    text: string;
    type: monaco.languages.CompletionItemKind;
    insertText: string;
    detail: string;
  }> = fieldNames.map((field: string) => {
    return {
      text: field,
      type: monaco.languages.CompletionItemKind.Field,
      insertText: `${field}: `,
      detail: '',
    };
  });

  return fieldSuggestions;
};

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
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

    if (suggestions.suggestColumns) {
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern));
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          detail: '',
          insertText: sk.value,
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
