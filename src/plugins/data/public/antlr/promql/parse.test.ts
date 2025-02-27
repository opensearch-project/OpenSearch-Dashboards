/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, Lexer as LexerType, Parser as ParserType } from 'antlr4ng';
import { getCurrentStatement, shouldSuggestTemplates, createParser } from './parse'; // Update the path
import { CursorPosition, LexerConstructor, ParserConstructor } from '../shared/types';
import { getCursorIndex } from '../shared/cursor';

jest.mock('../shared/cursor', () => ({
  getCursorIndex: jest.fn(),
}));

jest.mock('antlr4ng', () => {
  const actual = jest.requireActual('antlr4ng');
  return {
    ...actual,
    CharStream: {
      fromString: jest.fn((input) => ({ input })),
    },
    CommonTokenStream: jest.fn().mockImplementation((lexer) => ({
      lexer,
      fill: jest.fn(),
    })),
  };
});

describe('getCurrentStatement', () => {
  it('should return the current statement and cursor index when there are no semicolons', () => {
    const query = 'SELECT * FROM table';
    const cursorIndex = 10;
    const result = getCurrentStatement(query, cursorIndex);
    expect(result).toEqual({ statement: 'SELECT * FROM table', cursorIndex: 10 });
  });

  it('should return the current statement and cursor index when there are semicolons', () => {
    const query = 'SELECT * FROM table1; SELECT * FROM table2;';
    const cursorIndex = 25;
    const result = getCurrentStatement(query, cursorIndex);
    expect(result).toEqual({ statement: ' SELECT * FROM table2', cursorIndex: 4 });
  });

  it('should handle the cursor at the start of the statement', () => {
    const query = 'SELECT * FROM table1; SELECT * FROM table2;';
    const cursorIndex = 22;
    const result = getCurrentStatement(query, cursorIndex);
    expect(result).toEqual({ statement: ' SELECT * FROM table2', cursorIndex: 1 });
  });
});

describe('shouldSuggestTemplates', () => {
  it('should return true if the cursor is at the start of the query', () => {
    const query = 'SELECT * FROM table';
    const cursor: CursorPosition = { line: 1, column: 0 };
    (getCursorIndex as jest.Mock).mockReturnValue(0);
    const result = shouldSuggestTemplates(query, cursor);
    expect(result).toBe(true);
  });

  it('should return true if the cursor is before the first keyword in the statement', () => {
    const query = 'SELECT * FROM table';
    const cursor: CursorPosition = { line: 1, column: 1 };
    (getCursorIndex as jest.Mock).mockReturnValue(1);
    const result = shouldSuggestTemplates(query, cursor);
    expect(result).toBe(true);
  });

  it('should return true if the current statement is an explain statement', () => {
    const query = 'EXPLAIN SELECT * FROM table';
    const cursor: CursorPosition = { line: 1, column: 8 };
    (getCursorIndex as jest.Mock).mockReturnValue(8);
    const result = shouldSuggestTemplates(query, cursor);
    expect(result).toBe(true);
  });

  it('should return false if the cursor is after the first keyword in the statement', () => {
    const query = 'SELECT * FROM table';
    const cursor: CursorPosition = { line: 1, column: 10 };
    (getCursorIndex as jest.Mock).mockReturnValue(10);
    const result = shouldSuggestTemplates(query, cursor);
    expect(result).toBe(false);
  });
});
