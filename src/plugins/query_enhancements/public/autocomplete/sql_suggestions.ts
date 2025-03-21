/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import {
  QuerySuggestion,
  QuerySuggestionGetFn,
  QuerySuggestionGetFnArgs,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
  fetchColumnValues,
  SuggestionItemDetailsTags,
  SQL_SUGGESTION_IMPORTANCE,
  SQL_SYMBOLS,
  getOpenSearchSqlAutoCompleteSuggestions,
} from '../../../data/public';

/**
 * SQL query suggestion provider
 *
 * This implementation uses the sophisticated ANTLR-based parser from the data plugin
 * to provide context-aware suggestions based on the cursor position in the query.
 */
export const getSQLSuggestions: QuerySuggestionGetFn = async ({
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
    const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: QuerySuggestion[] = [];

    // Fetch columns and values
    if (suggestions.suggestColumns?.tables?.length) {
      finalSuggestions.push(...formatFieldsToSuggestions(indexPattern, (f: any) => `${f} `, '2'));
    }

    if (suggestions.suggestColumnValuePredicate) {
      switch (suggestions.suggestColumnValuePredicate) {
        case 'COLUMN': {
          finalSuggestions.push(
            ...formatFieldsToSuggestions(indexPattern, (f: any) => `${f} `, '2')
          );
          break;
        }
        case 'OPERATOR': {
          finalSuggestions.push({
            text: '=',
            insertText: '= ',
            type: monaco.languages.CompletionItemKind.Operator,
            detail: SuggestionItemDetailsTags.Operator,
            sortText: '0',
          });
          break;
        }
        case 'LPAREN': {
          finalSuggestions.push({
            text: '(',
            insertText: '( ',
            type: monaco.languages.CompletionItemKind.Keyword,
            detail: SuggestionItemDetailsTags.Keyword,
            sortText: '0',
          });
          break;
        }
        case 'END_IN_TERM': {
          finalSuggestions.push({
            text: ',',
            insertText: ', ',
            type: monaco.languages.CompletionItemKind.Keyword,
            detail: SuggestionItemDetailsTags.Keyword,
            sortText: '0',
          });
          finalSuggestions.push({
            text: ')',
            insertText: ') ',
            type: monaco.languages.CompletionItemKind.Keyword,
            detail: SuggestionItemDetailsTags.Keyword,
            sortText: '08',
          });
          break;
        }
        case 'VALUE': {
          if (suggestions.suggestValuesForColumn) {
            finalSuggestions.push(
              ...formatValuesToSuggestions(
                await fetchColumnValues(
                  indexPattern.title,
                  suggestions.suggestValuesForColumn,
                  services,
                  indexPattern.fields.find(
                    (field) => field.name === suggestions.suggestValuesForColumn
                  ),
                  datasetType
                ).catch(() => []),
                (val: any) => (typeof val === 'string' ? `'${val}' ` : `${val} `)
              )
            );
          }
          break;
        }
      }
    }

    // Fill in aggregate functions
    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...SQL_SYMBOLS.AGREGATE_FUNCTIONS.map((af) => ({
          text: af,
          type: monaco.languages.CompletionItemKind.Function,
          insertText: `${af} `,
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
          sortText: SQL_SUGGESTION_IMPORTANCE.get(sk.id) ?? '9' + sk.value.toLowerCase(),
        }))
      );
    }

    return finalSuggestions;
  } catch (error) {
    // Handle error silently
    return [];
  }
};
