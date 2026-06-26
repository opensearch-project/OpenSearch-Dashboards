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
import { buildCommandSuggestion, CommandSuggestion } from './command_suggestion';

export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  // Stable machine-readable identity for a recognized diagnostic (e.g. the
  // command-typo suggestion). Absent for raw ANTLR errors.
  code?: CommandSuggestion['code'];
  // Structured, deterministic correction that drives a Monaco quick-fix
  // lightbulb. Absent when there is no unambiguous rewrite.
  fix?: CommandSuggestion['fix'];
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

    // When the offending token is a misspelled command, replace ANTLR's noisy
    // "mismatched input ... expecting {40 keywords}" message with a friendly
    // suggestion and attach a one-click fix. Falls back to the raw message.
    const suggestion = buildCommandSuggestion(recognizer, offendingSymbol, e);

    this.errors.push({
      message: suggestion?.message ?? msg,
      code: suggestion?.code,
      fix: suggestion?.fix,
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
