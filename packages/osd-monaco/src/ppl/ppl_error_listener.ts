/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ANTLRErrorListener,
  RecognitionException,
  Recognizer,
  Token,
  ATNSimulator,
} from 'antlr4ng';

export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export class PPLSyntaxErrorListener implements ANTLRErrorListener {
  public errors: SyntaxError[] = [];

  syntaxError<S extends Token, T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    offendingSymbol: S | null,
    line: number,
    charPositionInLine: number,
    msg: string,
    e: RecognitionException | null
  ): void {
    // Calculate end position based on offending symbol if available
    let endColumn = charPositionInLine + 1;
    if (offendingSymbol && offendingSymbol.text) {
      endColumn = charPositionInLine + offendingSymbol.text.length;
    }

    this.errors.push({
      message: msg,
      line,
      column: charPositionInLine,
      endLine: line,
      endColumn,
    });
  }

  reportAmbiguity<T extends ATNSimulator>(): void {}
  reportAttemptingFullContext<T extends ATNSimulator>(): void {}
  reportContextSensitivity<T extends ATNSimulator>(): void {}

  clear(): void {
    this.errors = [];
  }
}
