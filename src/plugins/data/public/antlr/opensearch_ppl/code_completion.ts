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
import { SimplifiedOpenSearchPPLLexer } from '@osd/antlr-grammar';
import {
  CursorPosition,
  OpenSearchPplAutocompleteResult,
  AutocompleteResultBase,
} from '../shared/types';
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
import { getPPLQuerySnippetForSuggestions } from '../../query_snippet_suggestions/ppl/suggestions';
import {
  tryRuntimeGrammarSuggestions,
  resolveKeywordSuggestionDetails,
  resolveSupportedNonLiteralKeywordDetails,
  isCommandPositionInCurrentSegment,
  isLikelyCommandKeyword,
  isLikelyExpressionFunctionKeyword,
  INFERRED_RUNTIME_FUNCTION_DETAILS,
} from './runtime_ppl_grammar/opensearch_ppl_autocomplete';

// Utility function to extract query text up to cursor position
const extractQueryTillCursor = (
  fullQuery: string,
  cursorPosition: { lineNumber: number; column: number }
) => {
  const lines = fullQuery.split('\n');

  // Get all lines before the cursor line
  const linesBefore = lines.slice(0, cursorPosition.lineNumber - 1);

  // Get the current line up to cursor position
  const currentLine = lines[cursorPosition.lineNumber - 1] || '';
  const currentLineUpToCursor = currentLine.slice(0, cursorPosition.column - 1);

  // Combine all text up to cursor
  return [...linesBefore, currentLineUpToCursor].join('\n');
};
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

// Check whether the result contains content that the renderers actually handle.
// Flags like suggestTemplates, suggestColumnAliases, suggestDatabases, and
// suggestScalarFunctions are not rendered by either provider, so they must not
// gate the compiled fallback.
function hasActionableContent(result: AutocompleteResultBase): boolean {
  if (result.suggestKeywords && result.suggestKeywords.length > 0) return true;
  const r = result as OpenSearchPplAutocompleteResult;
  return !!(
    r.suggestColumns ||
    r.suggestSourcesOrTables ||
    r.suggestValuesForColumn ||
    r.suggestAggregateFunctions ||
    r.suggestRenameAs ||
    r.suggestSingleQuotes
  );
}

// Helper to format column value suggestions
async function formatColumnValueSuggestions(
  indexPatternTitle: string,
  columnName: string,
  services: any,
  indexPattern: any,
  datasetType: any,
  isInQuotes: boolean
): Promise<QuerySuggestion[]> {
  return formatValuesToSuggestions(
    await fetchColumnValues(
      indexPatternTitle,
      columnName,
      services,
      indexPattern,
      datasetType
    ).catch(() => []),
    (val: any) => {
      const isStringValue = typeof val === 'string';
      return getInsertText(val?.toString() || '', 'value', isInQuotes, { isStringValue });
    }
  );
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
        ...Object.entries(PPL_AGGREGATE_FUNCTIONS).map(([af]) => ({
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
    const cursor: CursorPosition = {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    };
    // Check feature flag for runtime grammar (defaults to enabled)
    const runtimeGrammarEnabled =
      services?.uiSettings?.get('query:enhancements:runtimePplGrammar') !== false;

    const runtimeSuggestions = runtimeGrammarEnabled
      ? tryRuntimeGrammarSuggestions(query, cursor, services, indexPattern, false)
      : null;
    const suggestions =
      runtimeSuggestions && hasActionableContent(runtimeSuggestions)
        ? runtimeSuggestions
        : getSimplifiedOpenSearchPplAutoCompleteSuggestions(query, cursor);

    const finalSuggestions: QuerySuggestion[] = [];
    const queryTillCursor =
      position && position.lineNumber && position.column
        ? extractQueryTillCursor(query, {
            lineNumber: position.lineNumber,
            column: position.column,
          })
        : query.slice(0, selectionEnd);
    const isInQuotes = suggestions.isInQuote || false;
    const isInBackQuote = suggestions.isInBackQuote || false;
    const isRuntimeGrammar = runtimeSuggestions === suggestions;

    // Runtime-specific context detection
    if (isRuntimeGrammar) {
      const isCommandPosition = isCommandPositionInCurrentSegment(queryTillCursor);

      if (suggestions.suggestColumns && (isInBackQuote || !isInQuotes)) {
        const initialFields = indexPattern.fields;
        const cursorPosition = queryTillCursor.length;
        const availableFields = getAvailableFieldsForAutocomplete(
          query,
          cursorPosition,
          initialFields,
          (field: { subType?: unknown }) => !field?.subType
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
              return f.startsWith('_') ? `99` : `3`;
            }
          )
        );
      }

      if (suggestions.suggestValuesForColumn && (isInQuotes || !isInBackQuote)) {
        finalSuggestions.push(
          ...(await formatColumnValueSuggestions(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern,
            datasetType,
            isInQuotes
          ))
        );
      }

      // Runtime grammar keyword processing (with heuristics)
      // When preferColumnSuggestionsOnly is set (e.g. `rex field =`), suppress
      // keyword and snippet noise so only field suggestions are shown.
      if (suggestions.suggestKeywords?.length && !suggestions.preferColumnSuggestionsOnly) {
        const literalKeywords = suggestions.suggestKeywords.filter((sk) => sk.value);
        finalSuggestions.push(
          ...literalKeywords.map((sk) => {
            const keywordDetails = resolveKeywordSuggestionDetails(sk);
            const inferredFunctionDetails =
              !keywordDetails &&
              !isCommandPosition &&
              (sk.followsOpeningParen ||
                sk.inRuntimeFunctionContext ||
                isLikelyExpressionFunctionKeyword(sk))
                ? INFERRED_RUNTIME_FUNCTION_DETAILS
                : null;
            const functionDetails = keywordDetails?.isFunction
              ? keywordDetails
              : inferredFunctionDetails;
            const shouldTreatAsCommand =
              !keywordDetails && isCommandPosition && isLikelyCommandKeyword(sk);

            if (functionDetails) {
              const functionName = sk.value;
              return {
                text: `${functionName}()`,
                type:
                  KEYWORD_ITEM_KIND_MAP.get(functionDetails.type) ??
                  monaco.languages.CompletionItemKind.Function,
                insertText: getInsertText(functionName, 'function', isInQuotes, {
                  hasOptionalParam: functionDetails?.optionalParam,
                  isSnippet: true,
                }),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
                detail: functionDetails.type,
                sortText: functionDetails.importance,
                documentation: Documentation[sk.value.toUpperCase()] ?? '',
              };
            } else if (keywordDetails && !keywordDetails.isFunction) {
              return {
                text: sk.value,
                type:
                  KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
                  monaco.languages.CompletionItemKind.Keyword,
                insertText: getInsertText(sk.value, 'keyword', isInQuotes),
                detail: keywordDetails.type,
                sortText: keywordDetails.importance,
                documentation: Documentation[sk.value.toUpperCase()] ?? '',
              };
            } else if (shouldTreatAsCommand) {
              return {
                text: sk.value,
                type:
                  KEYWORD_ITEM_KIND_MAP.get(SuggestionItemDetailsTags.Command) ??
                  monaco.languages.CompletionItemKind.Function,
                insertText: getInsertText(sk.value, 'keyword', isInQuotes),
                detail: SuggestionItemDetailsTags.Command,
                sortText: '98' + sk.value,
                documentation: Documentation[sk.value.toUpperCase()] ?? '',
              };
            } else {
              return {
                text: sk.value,
                insertText: getInsertText(sk.value, 'keyword', isInQuotes),
                type: monaco.languages.CompletionItemKind.Keyword,
                detail: SuggestionItemDetailsTags.Keyword,
                sortText: PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '98' + sk.value,
                documentation: Documentation[sk.value.toUpperCase()] ?? '',
              };
            }
          })
        );

        const supportedSymbolicKeywords = suggestions.suggestKeywords
          .filter((sk) => !sk.value)
          .map((sk) => resolveSupportedNonLiteralKeywordDetails(sk))
          .filter((details): details is { insertText: string; label: string; sortText: string } =>
            Boolean(details)
          );

        if (supportedSymbolicKeywords.length > 0) {
          finalSuggestions.push(
            ...supportedSymbolicKeywords.map((details) => {
              return {
                text: details.label,
                insertText: details.insertText,
                type: monaco.languages.CompletionItemKind.Keyword,
                detail: SuggestionItemDetailsTags.Keyword,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
                sortText: details.sortText,
              };
            })
          );
        }
      }

      // Process shared suggestion types (must come after keywords to maintain ordering)
      if (suggestions.suggestAggregateFunctions && !suggestions.preferColumnSuggestionsOnly) {
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

      // Handle single quote suggestions when suggestSingleQuotes flag is set
      if (suggestions.suggestSingleQuotes) {
        const singleQuoteDetails = SUPPORTED_NON_LITERAL_KEYWORDS.get(
          SimplifiedOpenSearchPPLLexer.SQUOTA_STRING
        );
        if (singleQuoteDetails) {
          finalSuggestions.push({
            text: singleQuoteDetails.label,
            insertText: singleQuoteDetails.insertText,
            type: monaco.languages.CompletionItemKind.Keyword,
            detail: SuggestionItemDetailsTags.Keyword,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
            sortText: singleQuoteDetails.sortText,
          });
        }
      }
    } else {
      // Compiled grammar path - matching main branch exactly
      if (suggestions.suggestColumns && (isInBackQuote || !isInQuotes)) {
        const initialFields = indexPattern.fields;
        const cursorPosition = position?.column || selectionEnd;
        const availableFields = getAvailableFieldsForAutocomplete(
          query,
          cursorPosition,
          initialFields,
          (field: { subType?: unknown }) => !field?.subType
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
              return f.startsWith('_') ? `99` : `3`;
            }
          )
        );
      }

      if (suggestions.suggestValuesForColumn && (isInQuotes || !isInBackQuote)) {
        finalSuggestions.push(
          ...(await formatColumnValueSuggestions(
            indexPattern.title,
            suggestions.suggestValuesForColumn,
            services,
            indexPattern,
            datasetType,
            isInQuotes
          ))
        );
      }

      // Compiled grammar keyword processing (matching main branch)
      if (suggestions.suggestKeywords?.length) {
        const literalKeywords = suggestions.suggestKeywords.filter((sk) => sk.value);
        finalSuggestions.push(
          ...literalKeywords.map((sk) => {
            const keywordDetails = PPL_SUGGESTION_IMPORTANCE.get(sk.id) ?? null;
            if (keywordDetails && keywordDetails.isFunction) {
              const functionName = sk.value;
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
                text: sk.value,
                type:
                  KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
                  monaco.languages.CompletionItemKind.Keyword,
                insertText: getInsertText(sk.value, 'keyword', isInQuotes),
                detail: keywordDetails.type,
                sortText: keywordDetails.importance,
                documentation: Documentation[sk.value.toUpperCase()] ?? '',
              };
            } else {
              return {
                text: sk.value,
                insertText: getInsertText(sk.value, 'keyword', isInQuotes),
                type: monaco.languages.CompletionItemKind.Keyword,
                detail: SuggestionItemDetailsTags.Keyword,
                sortText: PPL_SUGGESTION_IMPORTANCE.get(sk.id)?.importance ?? '98' + sk.value,
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
                sortText: details!.sortText,
              };
            })
          );
        }
      }

      // Process shared suggestion types (compiled path)
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

      // Handle single quote suggestions when suggestSingleQuotes flag is set
      if (suggestions.suggestSingleQuotes) {
        const singleQuoteDetails = SUPPORTED_NON_LITERAL_KEYWORDS.get(
          SimplifiedOpenSearchPPLLexer.SQUOTA_STRING
        );
        if (singleQuoteDetails) {
          finalSuggestions.push({
            text: singleQuoteDetails.label,
            insertText: singleQuoteDetails.insertText,
            type: monaco.languages.CompletionItemKind.Keyword,
            detail: SuggestionItemDetailsTags.Keyword,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
            sortText: singleQuoteDetails.sortText,
          });
        }
      }
    }

    const querySnippetSuggestions = suggestions.preferColumnSuggestionsOnly
      ? []
      : await getPPLQuerySnippetForSuggestions(queryTillCursor);

    // Deduplicate suggestions by text to prevent runtime grammar duplication issues
    const allSuggestions = [...finalSuggestions, ...querySnippetSuggestions];
    const seen = new Map<string, QuerySuggestion>();
    for (const suggestion of allSuggestions) {
      const key = suggestion.text || suggestion.insertText || '';
      if (!seen.has(key)) {
        seen.set(key, suggestion);
      }
    }
    return Array.from(seen.values());
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
  return parseQuery({
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
};
