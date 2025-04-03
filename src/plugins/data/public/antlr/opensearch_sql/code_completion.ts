/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CursorPosition, OpenSearchSqlAutocompleteResult } from '../shared/types';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { parseQuery } from '../shared/utils';

/**
 * @deprecated SQL suggestion provider has been moved to the query_enhancements plugin.
 * This function is kept for backward compatibility and will be removed in a future release.
 */
export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  // Return empty array - the actual implementation has been moved to query_enhancements plugin
  return [];
};

/**
 * Helper function to get SQL autocomplete suggestions
 * This is still exported for use by the query_enhancements plugin
 */
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
