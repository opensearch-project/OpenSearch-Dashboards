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

  reportAmbiguity<T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    dfa: any,
    startIndex: number,
    stopIndex: number,
    exact: boolean,
    ambigAlts: any,
    configs: any
  ): void {
    // Optional: handle ambiguity reporting for debugging
    // For now, we'll ignore ambiguity reports
  }

  reportAttemptingFullContext<T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    dfa: any,
    startIndex: number,
    stopIndex: number,
    conflictingAlts: any,
    configs: any
  ): void {
    // Optional: handle full context attempts for debugging
    // For now, we'll ignore these reports
  }

  reportContextSensitivity<T extends ATNSimulator>(
    recognizer: Recognizer<T>,
    dfa: any,
    startIndex: number,
    stopIndex: number,
    prediction: number,
    configs: any
  ): void {
    // Optional: handle context sensitivity reports for debugging
    // For now, we'll ignore these reports
  }

  /**
   * Clears all collected errors
   */
  clear(): void {
    this.errors = [];
  }
}
