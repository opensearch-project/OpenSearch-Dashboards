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

import {
  CharStream,
  CommonTokenStream,
  Lexer as LexerType,
  ParserRuleContext,
  Parser as ParserType,
  Token,
} from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { OpenSearchSQLLexer } from './generated/OpenSearchSQLLexer';
import { OpenSearchSQLParser } from './generated/OpenSearchSQLParser';
import {
  AutocompleteResultBase,
  CursorPosition,
  EnrichAutocompleteResult,
  GetParseTree,
  KeywordSuggestion,
  LexerConstructor,
  OpenSearchSqlAutocompleteResult,
  ParserConstructor,
} from './types';
import { TokenDictionary } from './table';
import { createParser } from './parse';
import { SqlErrorListener } from './sql_error_listerner';
// import { findCursorTokenIndex } from './cursor';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';

function getCursorIndex(query: string, cursor: { line: number; column: number }): number {
  const lines = query.split(/\r?\n/);
  let cursorIndex = 0;

  for (let i = 0; i < cursor.line - 1; i++) {
    cursorIndex += lines[i].length + 1; // +1 for newline character
  }

  cursorIndex += cursor.column - 1; // Convert to 0-based index

  return cursorIndex;
}

function getTokenNameByType(parser, tokenType) {
  return (
    parser.vocabulary.getSymbolicName(tokenType) || parser.vocabulary.getLiteralName(tokenType)
  );
}

export const getSuggestions = async ({ selectionStart, selectionEnd, query }) => {
  // console.log('selectionStart: ', selectionStart, ' query: ', query);
  const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
    line: 1,
    column: selectionStart + 1,
  });
  // console.log('this suggestions: ', suggestions);
  // console.log(
  //   'selectionStart: ',
  //   selectionStart,
  //   ' query: ',
  //   query,
  //   ' selectionEnd: ',
  //   selectionEnd
  // );
  // const cursorIndex = selectionStart;
  // const parser = new OpenSearchSQLParser(
  //   new CommonTokenStream(new OpenSearchSQLLexer(CharStream.fromString(query)))
  // );
  // const tree = parser.sqlStatement();
  // const core = new CodeCompletionCore(parser);
  // const candidates = core.collectCandidates(cursorIndex, tree);
  // const suggestions = [];
  // for (const [tokenType, _] of candidates.tokens.entries()) {
  //   const tokenName = getTokenNameByType(parser, tokenType);
  //   if (tokenName) {
  //     suggestions.push(tokenName);
  //   }
  // }
  return suggestions;
};

const quotesRegex = /^'(.*)'$/;

// Regex to identify if a token is an identifier (usually a word)
const possibleIdentifierPrefixRegex = /[\w]$/;

// Helper regex to match line separators
const lineSeparatorRegex = /\r\n|\n|\r/g;

// const startColumn = token.charPositionInLine;
// const endColumn = startColumn + (token.text?.length || 0);

// Function to get the start and end positions of a token
function getTokenPosition(token: Token, whitespaceToken: number) {
  const startColumn = token.start;
  const endColumn = token.stop + 1;
  const startLine = token.line;
  const endLine =
    token.type !== whitespaceToken || !token.text
      ? startLine
      : startLine + (token.text.match(lineSeparatorRegex)?.length || 0);

  return { startColumn, startLine, endColumn, endLine };
}

// Function to convert a cursor position (line and column) into a token index
export function findCursorTokenIndex(
  tokenStream: CommonTokenStream,
  cursor: { line: number; column: number },
  whitespaceToken: number,
  actualIndex?: boolean
): number | undefined {
  // Convert the cursor column from 1-based to 0-based indexing
  const cursorCol = cursor.column - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    const { startColumn, startLine, endColumn, endLine } = getTokenPosition(token, whitespaceToken);
    console.log('is white space: ', token.type === whitespaceToken);
    console.log(
      `Token ${i}: type: ${token.type}, '${token.text}' at [${startLine},${startColumn}] - [${endLine},${endColumn}]`
    );

    // Check if the token ends after the cursor position or is on the same line and ends after the cursor column
    if (endLine > cursor.line || (startLine === cursor.line && endColumn >= cursorCol)) {
      if (actualIndex) {
        return i;
      }

      // Handle the case where the cursor is positioned at the start of an identifier
      if (
        i > 0 &&
        startLine === cursor.line &&
        startColumn === cursorCol &&
        possibleIdentifierPrefixRegex.test(tokenStream.get(i - 1).text || '')
      ) {
        return i - 1;
      } else if (token.type === whitespaceToken) {
        return i + 1;
      }
      return i;
    }
  }

  // Handle the edge case where the cursor is at the end of the input string
  const lastToken: Token = tokenStream.get(tokenStream.size - 1);
  if (
    cursor.line >= lastToken.line &&
    cursor.column >= lastToken.start + (lastToken.text?.length || 0)
  ) {
    return tokenStream.size - 1;
  }

  console.error(
    `Error: Could not find cursor token index for line: ${cursor.line}, column: ${cursor.column}`
  );
  return undefined;
}

// Example function to log tokens for debugging
function logTokens(tokenStream: CommonTokenStream) {
  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    console.log(
      `Token ${i}: ${token.text} (Type: ${token.type}, Line: ${token.line}, Column: ${token.charPositionInLine})`
    );
  }
}

export interface ParsingSubject<A extends AutocompleteResultBase, L, P> {
  Lexer: LexerConstructor<L>;
  Parser: ParserConstructor<P>;
  tokenDictionary: TokenDictionary;
  ignoredTokens: Set<number>;
  rulesToVisit: Set<number>;
  getParseTree: GetParseTree<P>;
  enrichAutocompleteResult: EnrichAutocompleteResult<A>;
  query: string;
  cursor: CursorPosition;
  context?: ParserRuleContext;
}

export const parseQuery = <
  A extends AutocompleteResultBase,
  L extends LexerType,
  P extends ParserType
>({
  Lexer,
  Parser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
  query,
  cursor,
  context,
}: ParsingSubject<A, L, P>) => {
  const parser = createParser(Lexer, Parser, query);
  // const parser = new OpenSearchSQLParser(
  //   new CommonTokenStream(new OpenSearchSQLLexer(CharStream.fromString(query)))
  // );
  // const tokenStream = parser.inputStream as CommonTokenStream;
  const { tokenStream } = parser;
  // logTokens(tokenStream);
  // const whitespaceToken = OpenSearchSQLLexer.SPACE;
  const errorListener = new SqlErrorListener(tokenDictionary.SPACE);

  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);
  getParseTree(parser);
  const core = new CodeCompletionCore(parser);
  core.ignoredTokens = ignoredTokens;
  core.preferredRules = rulesToVisit;
  const commonTokenStream = tokenStream as CommonTokenStream;
  const cursorTokenIndex = findCursorTokenIndex(commonTokenStream, cursor, tokenDictionary.SPACE);
  if (cursorTokenIndex === undefined) {
    throw new Error(
      `Could not find cursor token index for line: ${cursor.line}, column: ${cursor.column}`
    );
  }

  const suggestKeywords: KeywordSuggestion[] = [];
  // debugger;
  const { tokens, rules } = core.collectCandidates(cursorTokenIndex, context);
  console.log('tokens: ', tokens, ' rules: ', rules);
  tokens.forEach((_, tokenType) => {
    // Literal keyword names are quoted
    const literalName = parser.vocabulary.getLiteralName(tokenType)?.replace(quotesRegex, '$1');
    // ClickHouse Parser does not give out literal names
    const name = literalName || parser.vocabulary.getSymbolicName(tokenType);

    if (!name) {
      throw new Error(`Could not get name for token ${tokenType}`);
    }

    suggestKeywords.push({
      value: name,
    });
  });

  const result: AutocompleteResultBase = {
    errors: errorListener.errors,
    suggestKeywords,
  };

  return enrichAutocompleteResult(result, rules, tokenStream, cursorTokenIndex, cursor, query);
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

// const parsed1 = getOpenSearchSqlAutoCompleteSuggestions('SELECT * FROM ', {
//   line: 0,
//   column: 13,
// });
// const parsed2 = getOpenSearchSqlAutoCompleteSuggestions(
//   'SELECT * FROM opensearch_dashboards_sample_data_ecommerce ',
//   { line: 1, column: 59 }
// );
const parsed2 = getOpenSearchSqlAutoCompleteSuggestions(
  'SELECT * FROM opensearch_dashboards_sample_data_ecommerce ',
  { line: 1, column: 59 }
);
// console.log('parsed1: ', parsed1);
console.log('parsed2: ', parsed2);
