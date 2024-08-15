/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { TokenDictionary } from '../opensearch_sql/table';
import * as c3 from 'antlr4-c3';
import { ParseTree, TokenStream } from 'antlr4ng';
import { AutocompleteData, AutocompleteResultBase, CursorPosition } from '../shared/types';
import { OpenSearchPPLLexer } from './.generated/OpenSearchPPLLexer';
import { OpenSearchPPLParser } from './.generated/OpenSearchPPLParser';

// These are keywords that we do not want to show in autocomplete
export function getIgnoredTokens(): number[] {
  const tokens = [];

  // const firstOperatorIndex = OpenSearchSQLParser.SLASH;
  // const lastOperatorIndex = OpenSearchSQLParser.ERROR_RECOGNITION;
  // for (let i = firstOperatorIndex; i <= lastOperatorIndex; i++) {
  //   // We actually want Star to appear in autocomplete
  //   tokens.push(i);
  // }

  // // Ignoring functions for now, need custom logic for them later
  // const firstFunctionIndex = OpenSearchSQLParser.AVG;
  // const lastFunctionIndex = OpenSearchSQLParser.TRIM;
  // for (let i = firstFunctionIndex; i <= lastFunctionIndex; i++) {
  //   tokens.push(i);
  // }

  // const firstCommonFunctionIndex = OpenSearchSQLParser.ABS;
  // const lastCommonFunctionIndex = OpenSearchSQLParser.MATCH_BOOL_PREFIX;
  // for (let i = firstCommonFunctionIndex; i <= lastCommonFunctionIndex; i++) {
  //   tokens.push(i);
  // }

  // tokens.push(OpenSearchSQLParser.EOF);

  return tokens;
}

const ignoredTokens = new Set(getIgnoredTokens());
// const tokenDictionary: TokenDictionary = {
const tokenDictionary: any = {
  // SPACE: OpenSearchPPLParser.WHITESPACE,
  FROM: OpenSearchPPLParser.FROM,
  OPENING_BRACKET: OpenSearchPPLParser.LT_PRTHS,
  CLOSING_BRACKET: OpenSearchPPLParser.RT_PRTHS,
  // JOIN: OpenSearchPPLParser.JOIN,
  // SEMICOLON: OpenSearchPPLParser.SEMI,
  // SELECT: OpenSearchSQLParser.SELECT,
};

const rulesToVisit = new Set([
  // OpenSearchPPLParser.RULE_constant,
  // OpenSearchPPLParser.RULE_columnName,
  // OpenSearchPPLParser.RULE_tableName,
  // OpenSearchPPLParser.RULE_aggregateFunction,
  // OpenSearchPPLParser.RULE_scalarFunctionName,
  // OpenSearchPPLParser.RULE_specificFunction,
  // OpenSearchPPLParser.RULE_windowFunctionClause,
  OpenSearchPPLParser.RULE_comparisonOperator,
]);

export function getParseTree(parser: OpenSearchPPLParser, type?: 'search' | 'from'): ParseTree {
  if (!type) {
    return parser.root();
  }

  switch (type) {
    case 'from':
      return parser.fromClause();
    case 'search':
      return parser.searchCommand();
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
): AutocompleteResultBase {
  return {};
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
