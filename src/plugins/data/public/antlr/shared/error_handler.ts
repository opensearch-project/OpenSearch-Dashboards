/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultErrorStrategy, Parser } from 'antlr4ng';

/**
 * Completion-friendly error strategy for ANTLR4-ng.
 * Prevents token deletion or aggressive recovery to retain context for code completion.
 */
export class CompletionErrorStrategy extends DefaultErrorStrategy {
  /**
   * Override recovery to do nothing (retain all tokens)
   */
  public recover(parser: Parser, e: any): void {
    // no-op: do not remove tokens
  }

  /**
   * Override sync to prevent automatic token skipping
   */
  public sync(parser: Parser): void {
    // no-op: leave parser state as-is
  }

  public reportError(recognizer: Parser, e: any) {
    // prevent default recovery behavior
  }
  public recoverInline(recognizer: Parser) {
    // return next token without deleting anything
    return recognizer.getCurrentToken();
  }
}
