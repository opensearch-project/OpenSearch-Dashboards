/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token, TokenStream } from 'antlr4ng';
import { ICandidateRule } from 'antlr4-c3';
import { CursorPosition } from '../shared/types';

export interface TokenPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

const possibleIdentifierPrefixRegex = /[\w]$/;

export const lineSeparatorRegex = /\r\n|\n|\r/g;

export function getTokenPosition(token: Token, whitespaceToken: number): TokenPosition {
  const startColumn = token.column;
  const endColumn = token.column + (token.text?.length || 0);
  const startLine = token.line;
  const endLine =
    token.type !== whitespaceToken || !token.text
      ? startLine
      : startLine + (token.text.match(lineSeparatorRegex)?.length || 0);

  return { startColumn, startLine, endColumn, endLine };
}

export function findCursorTokenIndex(
  tokenStream: TokenStream,
  cursor: CursorPosition,
  whitespaceToken: number,
  actualIndex?: boolean
): number | undefined {
  // Cursor position is 1-based, while token's charPositionInLine is 0-based
  const cursorCol = cursor.column - 1;

  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    const { startColumn, startLine, endColumn, endLine } = getTokenPosition(token, whitespaceToken);

    // endColumn makes sense only if startLine === endLine
    if (endLine > cursor.line || (startLine === cursor.line && endColumn > cursorCol)) {
      if (actualIndex) {
        return i;
      }

      if (
        i > 0 &&
        startLine === cursor.line &&
        startColumn === cursorCol &&
        // If previous token is an identifier (i.e. word, not a symbol),
        // then we want to return previous token index
        possibleIdentifierPrefixRegex.test(tokenStream.get(i - 1).text || '')
      ) {
        return i - 1;
      } else if (tokenStream.get(i).type === whitespaceToken) {
        return i + 1;
      }
      return i;
    }
  }

  return undefined;
}

export function getCursorIndex(query: string, cursor: CursorPosition): number {
  const lines = query.split(lineSeparatorRegex);
  const separatorMatch = query.match(lineSeparatorRegex);
  let separator: string | undefined = '';

  if (separatorMatch) {
    separator = separatorMatch[0];
  }

  let cursorIndex = 0;

  lines.reduce<string>((text, line, index) => {
    if (cursor.line - 1 === index) {
      if (!text.length) {
        cursorIndex = cursor.column - 1;
      } else {
        cursorIndex = text.length + cursor.column;
      }
    }

    if (index === 0) {
      return line;
    }

    return text + separator + line;
  }, '');

  return cursorIndex;
}

/*
Sometimes a preferredRule is triggered multiple times, and we haven't found a case where we'd want it.
We only want it to be triggered only once.

E.g.

root: 'DROP' 'INDEX' indexName;
indexName: identifier 'test';

case TestParser.RULE_indexName: {
  suggestIndexes = true;
}

If we'll write 'DROP INDEX index_name', 'test' token will fire the preferredRule event, and we'll try to suggest indexes.
In this case we need to check if our RULE_indexName is being triggered at the first 'identifier', and not 'test'. And this function was created for that.
*/
export function isStartingToWriteRule(cursorTokenIndex: number, rule: ICandidateRule): boolean {
  return cursorTokenIndex === rule.startTokenIndex;
}
