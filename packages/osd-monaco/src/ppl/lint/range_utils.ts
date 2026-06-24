/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, Token } from 'antlr4ng';
import { Diagnostic, DiagnosticRange } from './diagnostic';

/** Prefix prepended to pipe-first queries so the grammar can parse them. */
export const PIPE_FIRST_PREFIX = 'source=t ';

export function rangeFromTokens(start: Token, stop: Token): DiagnosticRange {
  const startLine = start.line;
  const startColumn = start.column;
  const stopText = stop.text ?? '';
  const endLine = stop.line;
  const endColumn = stop.column + stopText.length;
  return { startLine, startColumn, endLine, endColumn };
}

export function rangeFromContext(ctx: ParserRuleContext): DiagnosticRange {
  const start = ctx.start;
  const stop = ctx.stop ?? ctx.start;
  if (!start || !stop) {
    return { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 };
  }
  return rangeFromTokens(start, stop);
}

export function rangeWithinToken(
  token: Token,
  offsetInText: number,
  length: number
): DiagnosticRange {
  const text = token.text ?? '';
  const before = text.slice(0, offsetInText);
  const newlineCount = (before.match(/\n/g) ?? []).length;
  const startLine = token.line + newlineCount;
  let startColumn: number;
  if (newlineCount === 0) {
    startColumn = token.column + offsetInText;
  } else {
    const lastNewline = before.lastIndexOf('\n');
    startColumn = offsetInText - lastNewline - 1;
  }
  return {
    startLine,
    startColumn,
    endLine: startLine,
    endColumn: startColumn + length,
  };
}

/** Range spanning the entire query text. Used for diagnostics with no position info. */
export function wholeQueryRange(query: string): DiagnosticRange {
  const lines = query.split('\n');
  const endLine = Math.max(1, lines.length);
  const lastLine = lines[lines.length - 1] ?? '';
  return {
    startLine: 1,
    startColumn: 0,
    endLine,
    endColumn: lastLine.length,
  };
}

export function unquote(raw: string): string {
  if (raw.length >= 2) {
    const first = raw[0];
    const last = raw[raw.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

/** Subtract the pipe-first prefix length from line-one columns. */
export function remapPipeFirstColumns(diagnostics: Diagnostic[]): Diagnostic[] {
  const prefixLength = PIPE_FIRST_PREFIX.length;
  const shift = (range: DiagnosticRange): DiagnosticRange => ({
    ...range,
    startColumn:
      range.startLine === 1 ? Math.max(0, range.startColumn - prefixLength) : range.startColumn,
    endColumn: range.endLine === 1 ? Math.max(0, range.endColumn - prefixLength) : range.endColumn,
  });
  return diagnostics.map((diagnostic) => ({
    ...diagnostic,
    range: shift(diagnostic.range),
  }));
}
