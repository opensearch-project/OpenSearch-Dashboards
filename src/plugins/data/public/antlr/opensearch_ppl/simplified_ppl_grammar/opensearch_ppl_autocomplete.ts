/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as c3 from 'antlr4-c3';
import { ParserRuleContext, Token, TokenStream } from 'antlr4ng';
import {
  SimplifiedOpenSearchPPLLexer as OpenSearchPPLLexer,
  SimplifiedOpenSearchPPLParser as OpenSearchPPLParser,
} from '@osd/antlr-grammar';

import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  OpenSearchPplAutocompleteResult,
  ProcessVisitedRulesResult,
  SourceOrTableSuggestion,
  TableContextSuggestion,
} from '../../shared/types';

import { removePotentialBackticks } from '../../shared/utils';

// These are keywords that we want to show in autocomplete
const operatorsToInclude = [
  OpenSearchPPLParser.PIPE,
  OpenSearchPPLParser.EQUAL,
  OpenSearchPPLParser.COMMA,
  OpenSearchPPLParser.EQUAL,
  OpenSearchPPLParser.NOT_EQUAL,
  OpenSearchPPLParser.LESS,
  OpenSearchPPLParser.NOT_LESS,
  OpenSearchPPLParser.GREATER,
  OpenSearchPPLParser.NOT_GREATER,
  OpenSearchPPLParser.OR,
  OpenSearchPPLParser.AND,
  OpenSearchPPLParser.LT_PRTHS,
  OpenSearchPPLParser.RT_PRTHS,
  OpenSearchPPLParser.IN,
  OpenSearchPPLParser.SPAN,
  OpenSearchPPLParser.MATCH,
  OpenSearchPPLParser.MATCH_PHRASE,
  OpenSearchPPLParser.MATCH_BOOL_PREFIX,
  OpenSearchPPLParser.MATCH_PHRASE_PREFIX,
  OpenSearchPPLParser.SQUOTA_STRING,
];

const fieldRuleList = [
  OpenSearchPPLParser.RULE_fieldList,
  OpenSearchPPLParser.RULE_wcFieldList,
  OpenSearchPPLParser.RULE_sortField,
];

export function getIgnoredTokens(): number[] {
  // const tokens = [OpenSearchPPLParser.SPACE, OpenSearchPPLParser.EOF];
  const tokens = [];

  const firstOperatorIndex = OpenSearchPPLParser.MATCH;
  const lastOperatorIndex = OpenSearchPPLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    if (!operatorsToInclude.includes(i)) {
      tokens.push(i);
    }
  }

  const firstFunctionIndex = OpenSearchPPLParser.CASE;
  const lastFunctionIndex = OpenSearchPPLParser.CAST;

  for (let i = firstFunctionIndex; i <= lastFunctionIndex; i++) {
    if (!operatorsToInclude.includes(i)) {
      tokens.push(i);
    }
  }

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());
const tokenDictionary: any = {
  SPACE: OpenSearchPPLParser.SPACE,
  FROM: OpenSearchPPLParser.FROM,
  OPENING_BRACKET: OpenSearchPPLParser.LT_PRTHS,
  CLOSING_BRACKET: OpenSearchPPLParser.RT_PRTHS,
  SEARCH: OpenSearchPPLParser.SEARCH,
  SOURCE: OpenSearchPPLParser.SOURCE,
  PIPE: OpenSearchPPLParser.PIPE,
  ID: OpenSearchPPLParser.ID,
  EQUAL: OpenSearchPPLParser.EQUAL,
  IN: OpenSearchPPLParser.IN,
  COMMA: OpenSearchPPLParser.COMMA,
  BACKTICK_QUOTE: OpenSearchPPLParser.BQUOTA_STRING,
  DOT: OpenSearchPPLParser.DOT,
};

const rulesToVisit = new Set([
  OpenSearchPPLParser.RULE_statsFunctionName,
  OpenSearchPPLParser.RULE_takeAggFunction,
  OpenSearchPPLParser.RULE_integerLiteral,
  OpenSearchPPLParser.RULE_decimalLiteral,
  OpenSearchPPLParser.RULE_keywordsCanBeId,
  OpenSearchPPLParser.RULE_renameClasue,
  OpenSearchPPLParser.RULE_qualifiedName,
  OpenSearchPPLParser.RULE_tableQualifiedName,
  OpenSearchPPLParser.RULE_wcQualifiedName,
  OpenSearchPPLParser.RULE_keywordsCanBeId,
  OpenSearchPPLParser.RULE_positionFunctionName,
  OpenSearchPPLParser.RULE_searchableKeyWord,
  OpenSearchPPLParser.RULE_stringLiteral,
  OpenSearchPPLParser.RULE_searchCommand,
  OpenSearchPPLParser.RULE_searchComparisonOperator,
  OpenSearchPPLParser.RULE_comparisonOperator,
]);

const isAValidExpressionEndToken = (token: Token | undefined) => {
  if (!token) {
    return false;
  }
  const validExpressionEndTokens = new Set([tokenDictionary.ID, tokenDictionary.BACKTICK_QUOTE]);

  return validExpressionEndTokens.has(token.type);
};

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<OpenSearchPplAutocompleteResult> {
  let suggestSourcesOrTables: OpenSearchPplAutocompleteResult['suggestSourcesOrTables'];
  let suggestAggregateFunctions = false;
  let shouldSuggestColumns = false;
  let suggestFieldsInAggregateFunction = false;
  let suggestValuesForColumn: string | undefined;
  let suggestRenameAs: boolean = false;
  let suggestSingleQuotes: boolean = false;
  const rerunWithoutRules: number[] = [];

  const lastNonOperatorToken = findLastNonSpaceOperatorToken(tokenStream, cursorTokenIndex);

  for (const [ruleId, rule] of rules) {
    const parentRuleList = rule.ruleList;
    switch (ruleId) {
      case OpenSearchPPLParser.RULE_singleFieldRelevanceFunctionName:
      case OpenSearchPPLParser.RULE_multiFieldRelevanceFunctionName:
      case OpenSearchPPLParser.RULE_positionFunctionName:
      case OpenSearchPPLParser.RULE_integerLiteral:
      case OpenSearchPPLParser.RULE_decimalLiteral:
      case OpenSearchPPLParser.RULE_searchableKeyWord:
      case OpenSearchPPLParser.RULE_keywordsCanBeId: {
        break;
      }
      case OpenSearchPPLParser.RULE_statsFunctionName: {
        // suggests aggregate functions like avg, count etc after stats command , eg: source = abc | stats
        suggestAggregateFunctions = true;
        break;
      }
      case OpenSearchPPLParser.RULE_comparisonOperator:
      case OpenSearchPPLParser.RULE_searchComparisonOperator: {
        const lastToken = findLastNonSpaceToken(tokenStream, cursorTokenIndex);
        if (lastToken?.token && isAValidExpressionEndToken(lastToken?.token)) {
          rerunWithoutRules.push(OpenSearchPPLParser.RULE_searchComparisonOperator);
          rerunWithoutRules.push(OpenSearchPPLParser.RULE_comparisonOperator);
          rerunWithoutRules.push(OpenSearchPPLParser.RULE_searchCommand); // Since this is the parent of Search Comparison
        }
        break;
      }
      case OpenSearchPPLParser.RULE_searchCommand: {
        const firstTokenAfterPipe = findFirstNonSpaceTokenAfterPipe(tokenStream, cursorTokenIndex);
        if (
          !firstTokenAfterPipe ||
          ![OpenSearchPPLParser.DESCRIBE, OpenSearchPPLParser.SHOW].includes(
            firstTokenAfterPipe.token.type
          )
        ) {
          rerunWithoutRules.push(ruleId);
        }
        break;
      }
      case OpenSearchPPLParser.RULE_wcQualifiedName:
      case OpenSearchPPLParser.RULE_qualifiedName: {
        // Check if we're in a stats function context
        const isInStatsFunction = (parentRuleList ?? []).includes(
          OpenSearchPPLParser.RULE_statsFunction
        );

        if (isInStatsFunction) {
          suggestFieldsInAggregateFunction = true;
        }

        // Avoids suggestion fieldNames when last token is source. eg: source = , should suggest only tableName and not fieldname
        const lastTokenResult = findLastNonSpaceOperatorToken(tokenStream, cursorTokenIndex);
        if (lastTokenResult?.token.type === tokenDictionary.SOURCE) {
          break;
        }
        // In case we have a command with a field list for example source = abc | fields field1, field2, ... .
        // Suggest a fieldname only if the lastCharacter is not a fieldName. eg: source = abc | fields field1 -> should suggest | and , but source = abc | fields field1, -> should suggest fields
        if ((parentRuleList ?? []).some((parentRule) => fieldRuleList.includes(parentRule))) {
          const lastNonSpaceToken = findLastNonSpaceToken(tokenStream, cursorTokenIndex);
          if (lastNonSpaceToken?.token.type === tokenDictionary.ID) {
            break;
          } else {
            shouldSuggestColumns = true;
            break;
          }
        }

        // handling the scenario if the last Token is ID, we Don't suggest Column except in the case the second last token is Source to handle the scenario source = tablename fieldname suggestions
        if (lastNonOperatorToken && lastNonOperatorToken?.token.type === tokenDictionary.ID) {
          const secondLastTokenResult = findLastNonSpaceOperatorToken(
            tokenStream,
            lastNonOperatorToken.index
          );
          if (secondLastTokenResult?.token.type !== tokenDictionary.SOURCE) {
            break;
          }
        }
        shouldSuggestColumns = true;
        break;
      }
      case OpenSearchPPLParser.RULE_tableQualifiedName: {
        const lastToken = findLastNonSpaceToken(tokenStream, cursorTokenIndex);
        if (![tokenDictionary.ID, tokenDictionary.BQUOTA_STRING].includes(lastToken?.token.type)) {
          suggestSourcesOrTables = SourceOrTableSuggestion.TABLES;
        }
        break;
      }
      case OpenSearchPPLParser.RULE_renameClasue: {
        // if we're in the rename rule, we're either suggesting
        // field first token
        // 'as' second token
        // nothing third token, because it should be user specified

        const expressionStart = rule.startTokenIndex;
        if (expressionStart === cursorTokenIndex) {
          shouldSuggestColumns = true;
          break;
        }

        if (expressionStart + 2 === cursorTokenIndex) {
          suggestRenameAs = true;
          break;
        }

        break;
      }
      case OpenSearchPPLParser.RULE_stringLiteral: {
        // on its own, this rule would be triggered for relevance expressions and span. span
        // has its own rule, and relevance ....
        // todo: create span rule
        // todo: check if relevance expressions have incorrect behavior here
        if (cursorTokenIndex < 2) break; // should not happen due to grammar

        suggestSingleQuotes = true;

        let currentIndex = cursorTokenIndex - 1;
        // get the last token that appears other than whitespace
        const lastToken =
          tokenStream.get(currentIndex).type === tokenDictionary.SPACE
            ? tokenStream.get(currentIndex - 1)
            : tokenStream.get(currentIndex);
        // we only want to get the value if the very last token before WS is =, or
        // if its paren/comma and we pass by IN later. we don't need to check that we pass IN
        // because there is no valid syntax that will encounter the literal value rule with the
        // tokens '(' or ','
        if (
          ![tokenDictionary.EQUAL, tokenDictionary.OPENING_BRACKET, tokenDictionary.COMMA].includes(
            lastToken.type
          )
        ) {
          break;
        }

        const validIDToken = (token: Token) => {
          return token.type === tokenDictionary.ID || token.type === tokenDictionary.BACKTICK_QUOTE;
        };

        while (currentIndex > -1) {
          const token = tokenStream.get(currentIndex);
          if (
            !token ||
            token.type === tokenDictionary.PIPE ||
            token.type === tokenDictionary.SOURCE
          ) {
            break;
          }

          // NOTE: according to grammar, backticks in PPL are only possible for fields
          if (validIDToken(token)) {
            let combinedText = removePotentialBackticks(token.text ?? '');

            // stitch together IDs separated by DOTs
            let lookBehindIndex = currentIndex;
            while (lookBehindIndex > -1) {
              lookBehindIndex--;
              const prevToken = tokenStream.get(lookBehindIndex);
              if (!prevToken || prevToken.type !== tokenDictionary.DOT) {
                break;
              }
              lookBehindIndex--;
              combinedText = `${removePotentialBackticks(
                tokenStream.get(lookBehindIndex).text ?? ''
              )}.${combinedText}`;
            }

            suggestValuesForColumn = removePotentialBackticks(combinedText);
            break;
          }
          currentIndex--;
        }
        break;
      }
    }
  }

  return {
    suggestSourcesOrTables,
    suggestAggregateFunctions,
    shouldSuggestColumns,
    suggestFieldsInAggregateFunction,
    suggestValuesForColumn,
    suggestRenameAs,
    rerunWithoutRules,
    suggestSingleQuotes,
  };
}

// Helper functions for implicit where expression detection
function findLastNonSpaceOperatorToken(
  tokenStream: TokenStream,
  currentIndex: number
): { token: Token; index: number } | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (
      token.type !== OpenSearchPPLParser.SPACE &&
      token.type !== OpenSearchPPLParser.EOF &&
      !operatorsToInclude.includes(token.type)
    ) {
      return { token, index: i };
    }
  }
  return null;
}

// Helper functions for implicit where expression detection
function findLastNonSpaceToken(
  tokenStream: TokenStream,
  currentIndex: number
): { token: Token; index: number } | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (token.type !== OpenSearchPPLParser.SPACE && token.type !== OpenSearchPPLParser.EOF) {
      return { token, index: i };
    }
  }
  return null;
}

export function lastNonSpaceTokensContainSource(
  tokenStream: TokenStream,
  cursorIndex: number,
  count: number = 2
): boolean {
  const tokens: Token[] = [];
  let checked = 0;

  for (let i = cursorIndex - 1; i >= 0 && checked < count; i--) {
    const token = tokenStream.get(i);
    if (!token) continue;

    if (token.type !== OpenSearchPPLParser.SPACE && token.type !== OpenSearchPPLParser.EOF) {
      tokens.push(token);
      checked++;
    }
  }

  return tokens.some((t) => t.type === OpenSearchPPLParser.SOURCE);
}

function findFirstNonSpaceTokenAfterPipe(
  tokenStream: TokenStream,
  cursorIndex: number
): { token: Token; index: number } | null {
  let firstNonSpaceToken: { token: Token; index: number } | null = null;

  for (let i = cursorIndex - 1; i >= 0; i--) {
    const token = tokenStream.get(i);
    if (!token) continue;

    if (token.type !== OpenSearchPPLParser.SPACE && token.type !== OpenSearchPPLParser.EOF) {
      firstNonSpaceToken = { token, index: i };

      if (token.type === OpenSearchPPLParser.PIPE) {
        // Found pipe, now find the first non-space token after it (moving forward)
        for (let j = i + 1; j < tokenStream.size; j++) {
          const nextToken = tokenStream.get(j);
          if (!nextToken) break;

          if (
            nextToken.type !== OpenSearchPPLParser.SPACE &&
            nextToken.type !== OpenSearchPPLParser.EOF
          ) {
            return { token: nextToken, index: j };
          }
        }
        break;
      }
    }
  }

  return firstNonSpaceToken;
}

export function getParseTree(
  parser: OpenSearchPPLParser,
  type?: 'from' | 'alter' | 'insert' | 'update' | 'select'
): ParserRuleContext {
  parser.buildParseTrees = true;
  if (!type) {
    return parser.root();
  }

  switch (type) {
    case 'from':
      return parser.fromClause();
    default:
      return parser.root();
  }
}

export function enrichAutocompleteResult(
  baseResult: AutocompleteResultBase,
  rules: c3.CandidatesCollection['rules'],
  tokenStream: TokenStream,
  cursorTokenIndex: number,
  cursor: CursorPosition,
  query: string
): OpenSearchPplAutocompleteResult {
  const {
    shouldSuggestColumns,
    shouldSuggestColumnAliases,
    shouldSuggestConstraints,
    ...suggestionsFromRules
  } = processVisitedRules(rules, cursorTokenIndex, tokenStream);

  const currentToken = tokenStream?.get(cursorTokenIndex);
  const isInBackQuotes = currentToken?.type === OpenSearchPPLParser.BQUOTA_STRING;
  const isInQuotes =
    currentToken?.type === OpenSearchPPLParser.DQUOTA_STRING ||
    currentToken?.type === OpenSearchPPLParser.SQUOTA_STRING;

  const result: OpenSearchPplAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
    suggestColumns: shouldSuggestColumns ? ({} as TableContextSuggestion) : undefined,
    isInQuote: isInQuotes,
    isInBackQuote: isInBackQuotes,
  };
  return result;
}

export const openSearchPplAutocompleteData: AutocompleteData<
  any,
  OpenSearchPPLLexer,
  OpenSearchPPLParser
> = {
  Lexer: OpenSearchPPLLexer,
  Parser: OpenSearchPPLParser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
};
