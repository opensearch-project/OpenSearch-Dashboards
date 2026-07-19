/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, Token } from 'antlr4ng';
import { Diagnostic, DiagnosticRange } from './diagnostic';

export const PIPE_FIRST_PREFIX = 'source=t ';

export function rangeFromTokens(start: Token, stop: Token): DiagnosticRange {
  return {
    startLine: start.line,
    startColumn: start.column,
    endLine: stop.line,
    endColumn: stop.column + (stop.text ?? '').length,
  };
}

export function rangeFromContext(ctx: ParserRuleContext): DiagnosticRange {
  if (!ctx.start) {
    return { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 };
  }
  return rangeFromTokens(ctx.start, ctx.stop ?? ctx.start);
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

/** Fallback range spanning the entire query. */
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
    // A fix that targets a span different from the squiggle carries its own
    // range in the same prefixed coordinate space, so it must be shifted too —
    // otherwise applying the quick-fix on a pipe-first query lands the edit
    // `prefixLength` columns off. When the fix has no explicit range it reuses
    // the (already-shifted) diagnostic range, so nothing to do there.
    ...(diagnostic.fix?.range
      ? { fix: { ...diagnostic.fix, range: shift(diagnostic.fix.range) } }
      : {}),
  }));
}
