/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ANTLRErrorListener,
  ATNSimulator,
  RecognitionException,
  Recognizer,
  Token,
} from 'antlr4ng';

import type { CommandSuggestion } from '@osd/monaco';
import { TokenPosition, getTokenPosition } from '../shared/cursor';

export interface ParserSyntaxError extends TokenPosition {
  message: string;
  // Stable machine-readable identity for a recognized diagnostic. Reuses
  // CommandSuggestion's `code` (type-only import, erased at runtime) so the PPL
  // command-typo producer and this base error shape never drift.
  code?: CommandSuggestion['code'];
  // Structured quick-fix the marker builder turns into a Monaco lightbulb.
  fix?: CommandSuggestion['fix'];
  // ANTLR's original message, kept only when `message` was replaced by a
  // command-typo suggestion, so a consumer can revert when the command-suggestion
  // feature is off. Absent for un-rewritten errors.
  rawMessage?: string;
}

export class GeneralErrorListener implements ANTLRErrorListener {
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
    message: string,
    // Accepted so subclasses (e.g. PPLCommandErrorListener) can override with the
    // full ANTLR signature and call `super.syntaxError(..., e)`. Unused here;
    // backward-compatible for the SQL/DQL/autocomplete callers of the base class.
    _e?: RecognitionException | null
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
