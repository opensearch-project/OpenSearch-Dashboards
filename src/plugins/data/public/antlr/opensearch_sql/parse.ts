/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, Lexer as LexerType, Parser as ParserType } from 'antlr4ng';
import { CursorPosition, LexerConstructor, ParserConstructor } from '../shared/types';
import { getCursorIndex } from '../shared/cursor';
const spaceSymbols = '(\\s|\r\n|\n|\r)+';
const explainRegex = new RegExp(`^(${spaceSymbols})?explain${spaceSymbols}$`);
const multipleKeywordsRegex = new RegExp(`^(${spaceSymbols})?\\S+${spaceSymbols}`);

export function getCurrentStatement(
  query: string,
  cursorIndex: number
): { statement: string; cursorIndex: number } {
  const textBeforeCursor = query.slice(0, cursorIndex);
  const textAfterCursor = query.slice(cursorIndex);
  const semiColonBeforeIndex = textBeforeCursor.lastIndexOf(';');
  const semiColonAfterIndex = textAfterCursor.indexOf(';');
  const statementStartIndex = semiColonBeforeIndex > -1 ? semiColonBeforeIndex + 1 : 0;
  const statementEndIndex =
    semiColonAfterIndex > -1 ? semiColonAfterIndex + cursorIndex : query.length;
  const statement = query.slice(statementStartIndex, statementEndIndex);
  const newCursorIndex = cursorIndex - statementStartIndex;

  return { statement, cursorIndex: newCursorIndex };
}

// TODO Find a better way to suggestTemplates
export function shouldSuggestTemplates(query: string, cursor: CursorPosition): boolean {
  const cursorIndex = getCursorIndex(query, cursor);
  const currentStatement = getCurrentStatement(query, cursorIndex);
  const currentStatementBeforeCursor = currentStatement.statement
    .slice(0, currentStatement.cursorIndex)
    .toLowerCase();

  return Boolean(
    cursorIndex === 0 ||
      // First keyword in statement
      !currentStatementBeforeCursor.match(multipleKeywordsRegex) ||
      // Explain statement
      currentStatementBeforeCursor.match(explainRegex)
  );
}

export function createParser<L extends LexerType, P extends ParserType>(
  Lexer: LexerConstructor<L>,
  Parser: ParserConstructor<P>,
  query: string
): P {
  const parser = new Parser(new CommonTokenStream(new Lexer(CharStream.fromString(query))));
  parser.removeErrorListeners();
  return parser;
}
