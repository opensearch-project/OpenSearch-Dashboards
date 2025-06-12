/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as c3 from 'antlr4-c3';
import { ParseTree, Token, TokenStream } from 'antlr4ng';
import {
  AutocompleteData,
  AutocompleteResultBase,
  CursorPosition,
  OpenSearchPplAutocompleteResult,
  ProcessVisitedRulesResult,
  SourceOrTableSuggestion,
  TableContextSuggestion,
} from '../../shared/types';
import { OpenSearchPPLLexer } from './.generated/OpenSearchPPLLexer';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';
import { removePotentialBackticks } from '../../shared/utils';

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  // const tokens = [OpenSearchPPLParser.SPACE, OpenSearchPPLParser.EOF];
  const tokens = [];

  const firstOperatorIndex = OpenSearchPPLParser.MATCH;
  const lastOperatorIndex = OpenSearchPPLParser.ERROR_RECOGNITION;
  for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
    tokens.push(i);
  }

  const firstFunctionIndex = OpenSearchPPLParser.CASE;
  const lastFunctionIndex = OpenSearchPPLParser.CAST;
  const operatorsToInclude = [
    OpenSearchPPLParser.PIPE,
    OpenSearchPPLParser.EQUAL,
    OpenSearchPPLParser.COMMA,
    OpenSearchPPLParser.PLUS,
    OpenSearchPPLParser.MINUS,
    OpenSearchPPLParser.EQUAL,
    OpenSearchPPLParser.NOT_EQUAL,
    OpenSearchPPLParser.LESS,
    OpenSearchPPLParser.NOT_LESS,
    OpenSearchPPLParser.GREATER,
    OpenSearchPPLParser.NOT_GREATER,
    OpenSearchPPLParser.OR,
    OpenSearchPPLParser.AND,
    OpenSearchPPLParser.XOR,
    OpenSearchPPLParser.NOT,
    OpenSearchPPLParser.LT_PRTHS,
    OpenSearchPPLParser.RT_PRTHS,
    OpenSearchPPLParser.IN,
  ];
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
  OpenSearchPPLParser.RULE_fieldExpression,
  OpenSearchPPLParser.RULE_statsFunctionName,
  OpenSearchPPLParser.RULE_percentileAggFunction,
  OpenSearchPPLParser.RULE_takeAggFunction,
  OpenSearchPPLParser.RULE_timestampFunctionName,
  OpenSearchPPLParser.RULE_getFormatFunction,
  OpenSearchPPLParser.RULE_tableIdent,
  OpenSearchPPLParser.RULE_singleFieldRelevanceFunctionName,
  OpenSearchPPLParser.RULE_multiFieldRelevanceFunctionName,
  OpenSearchPPLParser.RULE_positionFunctionName,
  OpenSearchPPLParser.RULE_evalFunctionName,
  OpenSearchPPLParser.RULE_literalValue,
  OpenSearchPPLParser.RULE_integerLiteral,
  OpenSearchPPLParser.RULE_decimalLiteral,
  OpenSearchPPLParser.RULE_keywordsCanBeId,
  OpenSearchPPLParser.RULE_renameClasue,
  OpenSearchPPLParser.RULE_logicalExpression,
]);

export function processVisitedRules(
  rules: c3.CandidatesCollection['rules'],
  cursorTokenIndex: number,
  tokenStream: TokenStream
): ProcessVisitedRulesResult<OpenSearchPplAutocompleteResult> {
  let suggestSourcesOrTables: OpenSearchPplAutocompleteResult['suggestSourcesOrTables'];
  let suggestAggregateFunctions = false;
  let shouldSuggestColumns = false;
  let suggestValuesForColumn: string | undefined;
  let suggestRenameAs: boolean = false;
  const rerunWithoutRules: number[] = [];

  for (const [ruleId, rule] of rules) {
    switch (ruleId) {
      case OpenSearchPPLParser.RULE_integerLiteral:
      case OpenSearchPPLParser.RULE_decimalLiteral:
      case OpenSearchPPLParser.RULE_keywordsCanBeId: {
        break;
      }
      case OpenSearchPPLParser.RULE_logicalExpression: {
        if (!rule.ruleList.includes(OpenSearchPPLParser.RULE_pplCommands)) {
          // if our rule's parents doesn't include pplCommands, it must come through the 'commands' rule. this means
          // we'd want the preferred rule descendant of logicalExpression to be active, so we rerun the completion
          // engine's parse without this preferred rule blocking those descendants
          rerunWithoutRules.push(ruleId);
        }
        break;
      }
      case OpenSearchPPLParser.RULE_statsFunctionName: {
        suggestAggregateFunctions = true;
        break;
      }
      case OpenSearchPPLParser.RULE_fieldExpression: {
        if (cursorTokenIndex < 2) break; // should not happen due to grammar

        // get the last token that appears other than whitespace
        const lastToken =
          tokenStream.get(cursorTokenIndex - 1).type === tokenDictionary.SPACE
            ? tokenStream.get(cursorTokenIndex - 2)
            : tokenStream.get(cursorTokenIndex - 1);

        if (
          ![tokenDictionary.ID, tokenDictionary.BACKTICK_QUOTE, tokenDictionary.DOT].includes(
            lastToken.type
          )
        ) {
          shouldSuggestColumns = true;
        }
        break;
      }
      case OpenSearchPPLParser.RULE_tableIdent: {
        suggestSourcesOrTables = SourceOrTableSuggestion.TABLES;
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
      case OpenSearchPPLParser.RULE_literalValue: {
        // on its own, this rule would be triggered for relevance expressions and span. span
        // has its own rule, and relevance ....
        // todo: create span rule
        // todo: check if relevance expressions have incorrect behavior here
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
          if (!token || token.type === tokenDictionary.PIPE) {
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
    suggestValuesForColumn,
    suggestRenameAs,
    rerunWithoutRules,
  };
}

export function getParseTree(
  parser: OpenSearchPPLParser,
  type?: 'from' | 'alter' | 'insert' | 'update' | 'select'
): ParseTree {
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
  const result: OpenSearchPplAutocompleteResult = {
    ...baseResult,
    ...suggestionsFromRules,
    suggestColumns: shouldSuggestColumns ? ({} as TableContextSuggestion) : undefined,
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
