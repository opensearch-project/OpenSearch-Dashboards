/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import {
  ColumnValuePredicate,
  CursorPosition,
  OpenSearchSqlAutocompleteResult,
} from '../shared/types';
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
      finalSuggestions.push(...fetchFieldSuggestions(indexPattern, (f: any) => `${f} `));
    }

    if (suggestions.suggestColumnValuePredicate) {
      switch (suggestions.suggestColumnValuePredicate) {
        case ColumnValuePredicate.COLUMN: {
          finalSuggestions.push(...fetchFieldSuggestions(indexPattern, (f: any) => `${f} `));
          break;
        }
        case ColumnValuePredicate.OPERATOR: {
          finalSuggestions.push({
            text: '=',
            insertText: '= ',
            type: monaco.languages.CompletionItemKind.Operator,
            detail: SuggestionItemDetailsTags.Operator,
          });
        }
        case ColumnValuePredicate.VALUE: {
          if (suggestions.suggestValuesForColumn) {
            // get dataset for connecting to the cluster currently engaged
            const dataset = services.data.query.queryString.getQuery().dataset;

            // take the column and push in values for that column
            const res = await fetchColumnValues(
              [indexPattern.title],
              suggestions.suggestValuesForColumn,
              services,
              dataset
            );

            let i = 0;
            finalSuggestions.push(
              ...res.body.fields[0].values.map((val: any) => {
                i++;
                return {
                  text: val.toString(),
                  insertText: typeof val === 'string' ? `"${val}" ` : `${val} `,
                  type: monaco.languages.CompletionItemKind.Value,
                  detail: SuggestionItemDetailsTags.Value,
                  sortText: i.toString().padStart(3, '0'), // todo: change based on how many values can be returned
                };
              })
            );
          }
        }
      }
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
  const initialResult = parseQuery({
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

  if (!initialResult?.suggestColumnValuePredicate) {
    return initialResult;
  }

  // rerun with no preferred rules and specified context to grab missing lexer tokens
  const contextResult = parseQuery({
    Lexer: openSearchSqlAutocompleteData.Lexer,
    Parser: openSearchSqlAutocompleteData.Parser,
    tokenDictionary: openSearchSqlAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchSqlAutocompleteData.ignoredTokens,
    rulesToVisit: new Set(),
    getParseTree: openSearchSqlAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchSqlAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
    // context: initialResult.rerunAndConstrain,
  });

  // only need to modify initial results if there are context keywords
  if (contextResult?.suggestKeywords) {
    if (!initialResult?.suggestKeywords) {
      // set initial keywords to be context keywords
      initialResult.suggestKeywords = contextResult.suggestKeywords;
    } else {
      // merge initial and context keywords, removing duplicates
      const combined = [...initialResult.suggestKeywords, ...contextResult.suggestKeywords];

      // ES6 magic to filter out duplicate objects based on id field
      initialResult.suggestKeywords = combined.filter(
        (item, index, self) => index === self.findIndex((other) => other.id === item.id)
      );
    }
  }

  return initialResult;
};
