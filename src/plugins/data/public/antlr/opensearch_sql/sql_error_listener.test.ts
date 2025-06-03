/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATNSimulator, Recognizer, Token } from 'antlr4ng';
import { SqlErrorListener } from './sql_error_listerner'; // Update the path
import { getTokenPosition, TokenPosition } from '../shared/cursor';

jest.mock('../shared/cursor', () => ({
  getTokenPosition: jest.fn(),
}));

describe('SqlErrorListener', () => {
  let errorListener: SqlErrorListener;
  const mockWhitespaceToken = 1;

  beforeEach(() => {
    errorListener = new SqlErrorListener(mockWhitespaceToken);
  });

  it('should initialize with an empty errors array', () => {
    expect(errorListener.errors).toEqual([]);
  });

  it('should add an error with token position when a token is provided', () => {
    const mockToken = { line: 1, column: 1 } as Token;
    const mockTokenPosition: TokenPosition = {
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 5,
    };
    (getTokenPosition as jest.Mock).mockReturnValue(mockTokenPosition);

    const mockRecognizer = {} as Recognizer<ATNSimulator>;

    errorListener.syntaxError(mockRecognizer, mockToken, 1, 1, 'Syntax error');

    expect(getTokenPosition).toHaveBeenCalledWith(mockToken, mockWhitespaceToken);
    expect(errorListener.errors).toEqual([{ message: 'Syntax error', ...mockTokenPosition }]);
  });

  it('should add an error with start and end positions when no token is provided', () => {
    const mockRecognizer = {} as Recognizer<ATNSimulator>;

    errorListener.syntaxError(mockRecognizer, null, 1, 1, 'Syntax error');

    expect(errorListener.errors).toEqual([
      {
        message: 'Syntax error',
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });

  it('should handle reportAmbiguity without errors', () => {
    expect(() => errorListener.reportAmbiguity()).not.toThrow();
  });

  it('should handle reportAttemptingFullContext without errors', () => {
    expect(() => errorListener.reportAttemptingFullContext()).not.toThrow();
  });

  it('should handle reportContextSensitivity without errors', () => {
    expect(() => errorListener.reportContextSensitivity()).not.toThrow();
  });
});
