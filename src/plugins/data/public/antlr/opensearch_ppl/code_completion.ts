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

    // Store original cursor position values
    const originalLine = lineNumber || selectionStart;
    const originalColumn = column || selectionEnd;

    // Normalize the query
    const normalizedQuery = normalizeQuery(query, services);

    // Calculate cursor position adjustment if normalization added a prefix
    const adjustedCursor: CursorPosition = {
      line: originalLine,
      column: originalColumn,
    };

    // Only adjust if normalization actually changed the query
    if (normalizedQuery !== query) {
      // If we're on the first line and the query was normalized by adding a prefix
      if (originalLine === 1) {
        // Calculate the length of the added prefix (source = datasetName )
        const sourceRegex = /^source\s*=\s*[^|\s]+\s*/i;
        const match = normalizedQuery.match(sourceRegex);
        const prefixLength = match ? match[0].length : 0;

        // Adjust the column position
        adjustedCursor.column = originalColumn + prefixLength;
      }
    }

    // Use the normalized query and adjusted cursor position
    const suggestions = getOpenSearchPplAutoCompleteSuggestions(normalizedQuery, adjustedCursor);

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
  } catch (e) {
    return [];
  }
};

export const normalizeQuery = (query: string, services?: any): string => {
  // Leave empty queries or whitespace-only queries unchanged
  if (!query || query.trim() === '') {
    return query;
  }

  // Check if the query already starts with 'source = ' pattern (case-insensitive)
  const sourceRegex = /^\s*source\s*=\s*[^|\s]+/i;
  if (sourceRegex.test(query)) {
    return query; // Query already has source, leave it unchanged
  }

  // If we need to add a source, get the dataset name from queryStringService
  let datasetName = ''; // Fallback value

  try {
    if (services?.queryStringService?.getDatasetName) {
      datasetName = services.queryStringService.getDatasetName() || datasetName;
    } else if (services?.data?.query?.queryString?.getDefaultIndex) {
      // Alternative way to get the dataset if queryStringService is not available
      datasetName = services.data.query.queryString.getDefaultIndex() || datasetName;
    }
  } catch (e) {
    // If there's any error getting the dataset name, use the fallback
  }

  // Add the source = datasetName prefix to the query
  // Maintain any leading whitespace in the original query
  const trimmedQuery = query.trim();

  return `source = ${datasetName} ${trimmedQuery}`;
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
