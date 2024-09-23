/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, OpenSearchSqlAutocompleteResult } from '../shared/types';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';
import { SQL_SYMBOLS } from './constants';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { fetchColumnValues, fetchFieldSuggestions, parseQuery } from '../shared/utils';
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
  dataset,
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
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern, (f: any) => `${f} = `));
    }

    // if (suggestions.suggestValuesForColumn) {
    //   const res = await fetchColumnValues(
    //     [indexPattern.title],
    //     suggestions.suggestValuesForColumn,
    //     services,
    //     dataset
    //   );

    //   let i = 0;
    //   finalSuggestions.push(
    //     ...res.body.fields[0].values.map((val: any) => {
    //       i++;
    //       return {
    //         text: val.toString(),
    //         insertText: typeof val === 'string' ? `"${val}" ` : `${val} `,
    //         type: monaco.languages.CompletionItemKind.Value,
    //         detail: SuggestionItemDetailsTags.Value,
    //         sortText: i.toString().padStart(3, '0'),
    //       };
    //     })
    //   );
    // }

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

    if (suggestions.suggestViewsOrTables) {
      finalSuggestions.push({
        text: indexPattern.title,
        type: monaco.languages.CompletionItemKind.Struct,
        insertText: `${indexPattern.title} `,
        detail: SuggestionItemDetailsTags.Table,
      });
    }

    // Fill in SQL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${sk.value} `,
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
