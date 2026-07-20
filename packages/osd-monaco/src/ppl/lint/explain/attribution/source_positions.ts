/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext, Token } from 'antlr4ng';
import { DiagnosticRange } from '../../diagnostic';

export interface SourceSpan {
  startOffset: number;
  endOffset: number;
}

function buildCodePointOffsets(source: string): number[] {
  const offsets = [0];
  let utf16Offset = 0;
  for (const codePoint of source) {
    utf16Offset += codePoint.length;
    offsets.push(utf16Offset);
  }
  return offsets;
}

function buildLineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\r') {
      if (source[i + 1] === '\n') {
        i++;
      }
      starts.push(i + 1);
    } else if (source[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function lineIndexAt(starts: number[], offset: number): number {
  let low = 0;
  let high = starts.length;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (starts[middle] <= offset) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

/**
 * Converts parser token offsets into JavaScript/Monaco UTF-16 offsets. antlr4ng
 * builds code-point streams, while some generated/testing surfaces expose raw
 * UTF-16 indices; exact token text lets us support both without guessing.
 */
export class SourcePositionMapper {
  private readonly codePointOffsets: number[];
  private readonly lineStarts: number[];

  constructor(public readonly source: string) {
    this.codePointOffsets = buildCodePointOffsets(source);
    this.lineStarts = buildLineStarts(source);
  }

  private tokenStart(token: Token): number {
    const raw = Math.max(0, token.start ?? 0);
    const codePoint = this.codePointOffsets[raw];
    const text = token.text ?? '';
    const candidates = [raw, codePoint].filter(
      (candidate, index, all): candidate is number =>
        candidate !== undefined && all.indexOf(candidate) === index
    );

    if (text) {
      const exact = candidates.find(
        (candidate) => this.source.slice(candidate, candidate + text.length) === text
      );
      if (exact !== undefined) {
        return exact;
      }
    }

    return Math.min(codePoint ?? raw, this.source.length);
  }

  tokenSpan(token: Token): SourceSpan {
    const startOffset = this.tokenStart(token);
    const text = token.text ?? '';
    if (text) {
      return {
        startOffset,
        endOffset: Math.min(this.source.length, startOffset + text.length),
      };
    }

    const rawEnd = Math.max(token.start ?? 0, token.stop ?? token.start ?? 0) + 1;
    return {
      startOffset,
      endOffset: Math.min(this.codePointOffsets[rawEnd] ?? rawEnd, this.source.length),
    };
  }

  contextSpan(context: ParserRuleContext): SourceSpan {
    const start = context.start;
    const stop = context.stop ?? start;
    if (!start || !stop) {
      return { startOffset: 0, endOffset: 0 };
    }
    return {
      startOffset: this.tokenSpan(start).startOffset,
      endOffset: this.tokenSpan(stop).endOffset,
    };
  }

  range(startOffset: number, endOffset: number): DiagnosticRange {
    const safeStart = Math.max(0, Math.min(startOffset, this.source.length));
    const safeEnd = Math.max(safeStart, Math.min(endOffset, this.source.length));
    const startLineIndex = lineIndexAt(this.lineStarts, safeStart);
    const endLineIndex = lineIndexAt(this.lineStarts, safeEnd);
    return {
      startLine: startLineIndex + 1,
      startColumn: safeStart - this.lineStarts[startLineIndex],
      endLine: endLineIndex + 1,
      endColumn: safeEnd - this.lineStarts[endLineIndex],
    };
  }

  contextRange(context: ParserRuleContext): DiagnosticRange {
    const { startOffset, endOffset } = this.contextSpan(context);
    return this.range(startOffset, endOffset);
  }
}
