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
  formatAvailableFieldsToSuggestions,
  formatFieldsToSuggestions,
  formatValuesToSuggestions,
  parseQuery,
} from '../shared/utils';
import { openSearchPplAutocompleteData as simplifiedPplAutocompleteData } from './simplified_ppl_grammar/opensearch_ppl_autocomplete';
import { openSearchPplAutocompleteData as defaultPplAutocompleteData } from './default_ppl_grammar/opensearch_ppl_autocomplete';
import { getAvailableFieldsForAutocomplete } from './simplified_ppl_grammar/symbol_table_parser';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { SuggestionItemDetailsTags } from '../shared/constants';
import {
  PPL_AGGREGATE_FUNCTIONS,
  PPL_SUGGESTION_IMPORTANCE,
  SUPPORTED_NON_LITERAL_KEYWORDS,
  KEYWORD_ITEM_KIND_MAP,
} from './constants';
import { Documentation } from './ppl_documentation';

// Centralized function to generate appropriate insertion text based on context
function getInsertText(
  text: string,
  type: 'field' | 'value' | 'keyword' | 'function' | 'table',
  plainInsert: boolean = false,
  options: {
    needsBackticks?: boolean;
    isStringValue?: boolean;
    hasOptionalParam?: boolean;
    isSnippet?: boolean;
  } = {}
): string {
  const {
    needsBackticks = false,
    isStringValue = false,
    hasOptionalParam = false,
    isSnippet = false,
  } = options;

  if (plainInsert) {
    return text;
  } else {
    // Normal behavior when not in quotes
    switch (type) {
      case 'field':
        return needsBackticks ? `\`${text}\` ` : `${text} `;
      case 'value':
        return isStringValue ? `"${text}" ` : `${text} `;
      case 'keyword':
        return `${text} `;
      case 'function':
        if (isSnippet) {
          return hasOptionalParam ? `${text}() $0` : `${text}($0)`;
        }
        return `${text}()`;
      case 'table':
        return `${text} `;
      default:
        return `${text} `;
    }
  }
}

export const getDefaultSuggestions = async ({
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

    const suggestions = getDefaultOpenSearchPplAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

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
            indexPattern,
            datasetType
          ).catch(() => []),
          (val: any) => (typeof val === 'string' ? `"${val}" ` : `${val} `)
        )
      );
    }

    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...Object.entries(PPL_AGGREGATE_FUNCTIONS).map(([af, prop]) => ({
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
          sortText:
            PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '9' + sk.value.toLowerCase(), // '9' used to devalue every other suggestion
        }))
      );
    }

    return finalSuggestions;
  } catch (e) {
    return [];
  }
};

export const getSimplifiedPPLSuggestions = async ({
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

    const suggestions = getSimplifiedOpenSearchPplAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });
    const finalSuggestions: QuerySuggestion[] = [];
    const isInQuotes = suggestions.isInQuote || false;
    const isInBackQuote = suggestions.isInBackQuote || false;

    if (suggestions.suggestColumns && (isInBackQuote || !isInQuotes)) {
      const initialFields = indexPattern.fields;

      // Get available fields from symbol table based on current query context
      const cursorPosition = position?.column || selectionEnd;
      const availableFields = getAvailableFieldsForAutocomplete(
        query,
        cursorPosition,
        initialFields,
        (field) => !field?.subType
      );

      finalSuggestions.push(
        ...formatAvailableFieldsToSuggestions(
          availableFields,
          (f: string) => {
            if (suggestions.suggestFieldsInAggregateFunction) {
              return getInsertText(f, 'field', true);
            }
            const needsBackticks = f.includes('.') || f.includes('@');
            return getInsertText(f, 'field', isInBackQuote, { needsBackticks });
          },
          (f: string) => {
            return f.startsWith('_') ? `99` : `3`; // This devalues all the Field Names that start _ so that appear further down the autosuggest wizard
          }
        )
      );
    }

    if (suggestions.suggestValuesForColumn && (isInQuotes || !isInBackQuote)) {
      finalSuggestions.push(
        ...formatValuesToSuggestions(
          await fetchColumnValues(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern,
            datasetType
          ).catch(() => []),
          (val: any) => {
            const isStringValue = typeof val === 'string';
            return getInsertText(val?.toString() || '', 'value', isInQuotes, { isStringValue });
          }
        )
      );
    }

    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...Object.entries(PPL_AGGREGATE_FUNCTIONS).map(([af, prop]) => ({
          text: `${af}()`,
          type: monaco.languages.CompletionItemKind.Module,
          insertText: getInsertText(af, 'function', isInQuotes, {
            hasOptionalParam: prop?.optionalParam,
            isSnippet: true,
          }),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
          sortText: '67',
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    if (suggestions.suggestSourcesOrTables) {
      finalSuggestions.push({
        text: indexPattern.title,
        type: monaco.languages.CompletionItemKind.Struct,
        insertText: getInsertText(indexPattern.title, 'table', isInQuotes),
        detail: SuggestionItemDetailsTags.Table,
      });
    }

    if (suggestions.suggestRenameAs) {
      finalSuggestions.push({
        text: 'as',
        insertText: getInsertText('as', 'keyword', isInQuotes),
        type: monaco.languages.CompletionItemKind.Keyword,
        detail: SuggestionItemDetailsTags.Keyword,
      });
    }

    // Fill in PPL keywords
    if (suggestions.suggestKeywords?.length) {
      const literalKeywords = suggestions.suggestKeywords.filter((sk) => sk.value);
      finalSuggestions.push(
        ...literalKeywords.map((sk) => {
          const keywordDetails = PPL_SUGGESTION_IMPORTANCE.get(sk.id) ?? null;
          if (keywordDetails && keywordDetails.isFunction) {
            const functionName = sk.value.toLowerCase();
            return {
              text: `${functionName}()`,
              type:
                KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
                monaco.languages.CompletionItemKind.Function,
              insertText: getInsertText(functionName, 'function', isInQuotes, {
                hasOptionalParam: keywordDetails?.optionalParam,
                isSnippet: true,
              }),
              insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
              detail: keywordDetails.type,
              sortText: keywordDetails.importance,
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          } else if (keywordDetails && !keywordDetails.isFunction) {
            return {
              text: sk.value.toLowerCase(),
              type:
                KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
                monaco.languages.CompletionItemKind.Keyword,
              insertText: getInsertText(sk.value.toLowerCase(), 'keyword', isInQuotes),
              detail: keywordDetails.type,
              sortText: keywordDetails.importance,
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          } else {
            return {
              text: sk.value.toLowerCase(),
              insertText: getInsertText(sk.value.toLowerCase(), 'keyword', isInQuotes),
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: SuggestionItemDetailsTags.Keyword,
              // sortText is the only option to sort suggestions, compares strings
              sortText:
                PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '98' + sk.value.toLowerCase(), // '98' used to devalue every other suggestion
              documentation: Documentation[sk.value.toUpperCase()] ?? '',
            };
          }
        })
      );

      const supportedSymbolicKeywords = suggestions.suggestKeywords.filter(
        (sk) => !sk.value && SUPPORTED_NON_LITERAL_KEYWORDS.has(sk.id)
      );

      if (supportedSymbolicKeywords) {
        finalSuggestions.push(
          ...supportedSymbolicKeywords.map((sk) => {
            const details = SUPPORTED_NON_LITERAL_KEYWORDS.get(sk.id);
            return {
              text: details!.label,
              insertText: details!.insertText,
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: SuggestionItemDetailsTags.Keyword,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
              // sortText is the only option to sort suggestions, compares strings
              sortText: details!.sortText,
            };
          })
        );
      }
    }
    return finalSuggestions;
  } catch (e) {
    return [];
  }
};

export const getDefaultOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchPplAutocompleteResult => {
  return parseQuery({
    Lexer: defaultPplAutocompleteData.Lexer,
    Parser: defaultPplAutocompleteData.Parser,
    tokenDictionary: defaultPplAutocompleteData.tokenDictionary,
    ignoredTokens: defaultPplAutocompleteData.ignoredTokens,
    rulesToVisit: defaultPplAutocompleteData.rulesToVisit,
    getParseTree: defaultPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: defaultPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};

export const getSimplifiedOpenSearchPplAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchPplAutocompleteResult => {
  const res = parseQuery({
    Lexer: simplifiedPplAutocompleteData.Lexer,
    Parser: simplifiedPplAutocompleteData.Parser,
    tokenDictionary: simplifiedPplAutocompleteData.tokenDictionary,
    ignoredTokens: simplifiedPplAutocompleteData.ignoredTokens,
    rulesToVisit: simplifiedPplAutocompleteData.rulesToVisit,
    getParseTree: simplifiedPplAutocompleteData.getParseTree,
    enrichAutocompleteResult: simplifiedPplAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
    skipSymbolicKeywords: false,
  });
  return res;
};
