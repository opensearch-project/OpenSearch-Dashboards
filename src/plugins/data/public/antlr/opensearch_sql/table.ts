/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TokenStream, Lexer as LexerType, Parser as ParserType, Token } from 'antlr4ng';
import { createParser } from './parse';
import { getColumnAliasesFromSymbolTable, getTablesFromSymbolTable } from './symbol_table';
import {
  AutocompleteResultBase,
  CursorPosition,
  GetParseTree,
  LexerConstructor,
  ParserConstructor,
  SymbolTableVisitor,
  TableContextSuggestion,
} from '../shared/types';
import { findCursorTokenIndex } from '../shared/cursor';

export interface TokenDictionary {
  SPACE: number;
  FROM: number;
  OPENING_BRACKET: number;
  CLOSING_BRACKET: number;
  JOIN: number;
  SEMICOLON: number;
  SELECT: number;
}

export interface TableQueryPosition extends TableQueryPositionBase {
  type: 'from' | 'alter' | 'insert' | 'update';
  joinTableQueryPosition?: TableQueryPositionBase;
  selectTableQueryPosition?: TableQueryPositionBase;
}

export interface TableQueryPositionBase {
  start: number;
  end: number;
}

export interface ContextSuggestions {
  tableContextSuggestion?: TableContextSuggestion;
  suggestColumnAliases?: AutocompleteResultBase['suggestColumnAliases'];
}

/**
 * Finds the index of the closing bracket or semicolon in the token stream starting from a given index.
 * @param tokenStream - The token stream to search within.
 * @param tokenIndex - The index to start searching from.
 * @param dictionary - The token dictionary containing token types.
 * @returns The index of the closing bracket or semicolon or undefined if not found.
 */
export function getClosingBracketIndex(
  tokenStream: TokenStream,
  tokenIndex: number,
  dictionary: TokenDictionary
): { cursorIndex: number; tokenIndex: number } | undefined {
  let currentIndex = tokenIndex;

  while (currentIndex < tokenStream.size) {
    const token = tokenStream.get(currentIndex);

    if (token.type === dictionary.CLOSING_BRACKET || token.type === dictionary.SEMICOLON) {
      return { cursorIndex: token.start, tokenIndex: currentIndex };
    }

    if (token.type === dictionary.OPENING_BRACKET) {
      return undefined;
    }

    currentIndex++;
  }

  const lastIndex = tokenStream.size - 1;
  return { cursorIndex: tokenStream.get(lastIndex).start, tokenIndex: lastIndex };
}

/**
 * Determines the position of a table query within the token stream.
 * @param tokenStream - The token stream to search within.
 * @param tokenIndex - The index to start searching from.
 * @param dictionary - The token dictionary containing token types.
 * @returns The position of the table query or undefined if not found.
 */
export function getTableQueryPosition(
  tokenStream: TokenStream,
  tokenIndex: number,
  dictionary: TokenDictionary
): TableQueryPosition | undefined {
  let currentIndex = tokenIndex;
  let isAscending = false;

  // Go backward at first
  while (currentIndex >= 0 && currentIndex < tokenStream.size) {
    const token = tokenStream.get(currentIndex);

    // We don't want to check nested statement
    if (
      token.type === dictionary.OPENING_BRACKET ||
      token.type === dictionary.CLOSING_BRACKET ||
      token.type === dictionary.SEMICOLON
    ) {
      if (isAscending) {
        break;
      } else {
        currentIndex = tokenIndex;
        isAscending = true;
      }
    }

    if (token.type === dictionary.FROM) {
      const closingBracketIndex = getClosingBracketIndex(tokenStream, tokenIndex, dictionary);

      if (!closingBracketIndex) {
        break;
      }

      const joinIndex = getJoinIndex(
        tokenStream,
        currentIndex,
        closingBracketIndex.tokenIndex,
        dictionary
      );
      const joinTableQueryPosition = joinIndex
        ? ({
            start: joinIndex,
            end: closingBracketIndex.cursorIndex,
          } as const)
        : undefined;

      const selectToken = getPreviousToken(
        tokenStream,
        dictionary,
        closingBracketIndex.tokenIndex,
        dictionary.SELECT
      );
      const selectTableQueryPosition = selectToken
        ? ({
            start: selectToken.start,
            end: closingBracketIndex.cursorIndex,
          } as const)
        : undefined;

      return {
        start: token.start,
        end: closingBracketIndex.cursorIndex,
        type: 'from',
        joinTableQueryPosition,
        selectTableQueryPosition,
      };
    }

    if (isAscending) {
      currentIndex++;
    } else {
      currentIndex--;
    }

    // Go forward if nothing is found
    if (currentIndex === -1) {
      currentIndex = tokenIndex;
      isAscending = true;
    }
  }

  // Could not find FROM, so we look for other keywords
  currentIndex = tokenIndex;
  while (currentIndex >= 0) {
    const token = tokenStream.get(currentIndex);

    if (token.type === dictionary.SEMICOLON) {
      return undefined;
    }

    currentIndex--;
  }

  return undefined;
}

export function getJoinIndex(
  tokenStream: TokenStream,
  startIndex: number,
  endIndex: number,
  dictionary: TokenDictionary
): number | undefined {
  let currentIndex = startIndex;

  while (currentIndex < endIndex) {
    const token = tokenStream.get(currentIndex);

    if (token.type === dictionary.JOIN) {
      return token.stop + 1;
    }

    currentIndex++;
  }

  return undefined;
}

/**
 * Finds the previous token of a specified type in the token stream starting from a given index.
 * @param tokenStream - The token stream to search within.
 * @param dictionary - The token dictionary containing token types.
 * @param tokenIndex - The index to start searching from.
 * @param tokenType - The type of token to search for.
 * @returns The previous token of the specified type or undefined if not found.
 */
export function getPreviousToken(
  tokenStream: TokenStream,
  dictionary: TokenDictionary,
  tokenIndex: number,
  tokenType: number
): Token | undefined {
  let currentIndex = tokenIndex - 1;

  while (currentIndex > -1) {
    const token = tokenStream.get(currentIndex);
    // This is the end of previous statement, so we want to exit
    if (token.type === dictionary.SEMICOLON) {
      return undefined;
    }

    if (token.type === tokenType) {
      return token;
    }

    currentIndex--;
  }

  return undefined;
}

/**
 * Generates context suggestions for autocomplete based on the given query and cursor position.
 * @param Lexer - The lexer constructor.
 * @param Parser - The parser constructor.
 * @param symbolTableVisitor - The symbol table visitor.
 * @param tokenDictionary - The token dictionary containing token types.
 * @param getParseTree - The function to get the parse tree.
 * @param tokenStream - The token stream of the query.
 * @param cursor - The cursor position in the query.
 * @param query - The SQL query string.
 * @param explicitlyParseJoin - Whether to explicitly parse JOIN statements.
 * @returns The context suggestions for autocomplete.
 */
export function getContextSuggestions<L extends LexerType, P extends ParserType>(
  Lexer: LexerConstructor<L>,
  Parser: ParserConstructor<P>,
  symbolTableVisitor: SymbolTableVisitor,
  tokenDictionary: TokenDictionary,
  getParseTree: GetParseTree<P>,
  tokenStream: TokenStream,
  cursor: CursorPosition,
  query: string,
  explicitlyParseJoin?: boolean
): ContextSuggestions {
  // The actual token index, without special logic for spaces
  const actualCursorTokenIndex = findCursorTokenIndex(
    tokenStream,
    cursor,
    tokenDictionary.SPACE,
    true
  );
  if (!actualCursorTokenIndex) {
    throw new Error(
      `Could not find actualCursorTokenIndex at Ln ${cursor.line}, Col ${cursor.column}`
    );
  }

  const contextSuggestions: ContextSuggestions = {};
  const tableQueryPosition = getTableQueryPosition(
    tokenStream,
    actualCursorTokenIndex,
    tokenDictionary
  );

  if (tableQueryPosition) {
    const tableQuery = query.slice(tableQueryPosition.start, tableQueryPosition.end);
    const parser = createParser(Lexer, Parser, tableQuery);
    const parseTree = getParseTree(parser, tableQueryPosition.type);

    symbolTableVisitor.visit(parseTree);

    if (explicitlyParseJoin && tableQueryPosition.joinTableQueryPosition) {
      const joinTableQuery = query.slice(
        tableQueryPosition.joinTableQueryPosition.start,
        tableQueryPosition.joinTableQueryPosition.end
      );
      const joinParser = createParser(Lexer, Parser, joinTableQuery);
      const joinParseTree = getParseTree(joinParser, 'from');
      symbolTableVisitor.visit(joinParseTree);
    }

    if (tableQueryPosition.selectTableQueryPosition) {
      const selectTableQuery = query.slice(
        tableQueryPosition.selectTableQueryPosition.start,
        tableQueryPosition.selectTableQueryPosition.end
      );
      const selectParser = createParser(Lexer, Parser, selectTableQuery);
      const selectParseTree = getParseTree(selectParser, 'select');
      symbolTableVisitor.visit(selectParseTree);
    }

    const tables = getTablesFromSymbolTable(symbolTableVisitor);
    if (tables.length) {
      contextSuggestions.tableContextSuggestion = {
        tables,
      };
    }

    const columnAliases = getColumnAliasesFromSymbolTable(symbolTableVisitor);
    if (columnAliases.length) {
      contextSuggestions.suggestColumnAliases = columnAliases.map(({ name }) => ({ name }));
    }
  }

  return contextSuggestions;
}
