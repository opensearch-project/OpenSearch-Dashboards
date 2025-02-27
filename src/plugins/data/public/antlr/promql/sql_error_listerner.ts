/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ANTLRErrorListener, ATNSimulator, Recognizer, Token } from 'antlr4ng';

import { TokenPosition, getTokenPosition } from '../shared/cursor';

interface ParserSyntaxError extends TokenPosition {
  message: string;
}

export class SqlErrorListener implements ANTLRErrorListener {
  errors: ParserSyntaxError[];
  whitespaceToken: number;

  constructor(whitespaceToken: number) {
    this.errors = [];
    this.whitespaceToken = whitespaceToken;
  }

  syntaxError<S extends Token, T extends ATNSimulator>(
    _recognizer: Recognizer<T>,
    token: S | null,
    startLine: number,
    startColumn: number,
    message: string
  ): void {
    if (token) {
      const tokenPosition = getTokenPosition(token, this.whitespaceToken);
      this.errors.push({ message, ...tokenPosition });
    } else {
      this.errors.push({
        message,
        startLine,
        startColumn,
        endLine: startLine,
        endColumn: startColumn,
      });
    }
  }

  reportAmbiguity(): void {}
  reportAttemptingFullContext(): void {}
  reportContextSensitivity(): void {}
}
