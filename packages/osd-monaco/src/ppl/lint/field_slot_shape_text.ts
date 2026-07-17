/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiagnosticRange } from './diagnostic';

export interface FieldSlotShapeMatch {
  commandName: 'grokCommand' | 'parseCommand' | 'patternsCommand';
  keyword: 'grok' | 'parse' | 'patterns';
  expressionText: string;
  replacement?: string;
  range: DiagnosticRange;
}

interface Segment {
  start: number;
  end: number;
}

interface Identifier {
  text: string;
  end: number;
}

const COMMANDS: Record<
  string,
  { commandName: FieldSlotShapeMatch['commandName']; keyword: FieldSlotShapeMatch['keyword'] }
> = {
  grok: { commandName: 'grokCommand', keyword: 'grok' },
  parse: { commandName: 'parseCommand', keyword: 'parse' },
  patterns: { commandName: 'patternsCommand', keyword: 'patterns' },
};

function isIdentifierStart(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z_]/.test(ch);
}

function isIdentifierPart(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}

function readIdentifier(sourceText: string, index: number, end: number): Identifier | undefined {
  if (index >= end || !isIdentifierStart(sourceText[index])) {
    return undefined;
  }

  let cursor = index + 1;
  while (cursor < end && isIdentifierPart(sourceText[cursor])) {
    cursor++;
  }

  return { text: sourceText.slice(index, cursor), end: cursor };
}

function skipTrivia(sourceText: string, index: number, end: number): number {
  let cursor = index;

  while (cursor < end) {
    if (/\s/.test(sourceText[cursor])) {
      cursor++;
      continue;
    }

    if (sourceText[cursor] === '/' && sourceText[cursor + 1] === '/') {
      cursor += 2;
      while (cursor < end && sourceText[cursor] !== '\n') {
        cursor++;
      }
      continue;
    }

    if (sourceText[cursor] === '/' && sourceText[cursor + 1] === '*') {
      cursor += 2;
      while (cursor < end && !(sourceText[cursor] === '*' && sourceText[cursor + 1] === '/')) {
        cursor++;
      }
      cursor = Math.min(end, cursor + 2);
      continue;
    }

    break;
  }

  return cursor;
}

function splitCommandSegments(sourceText: string): Segment[] {
  const segments: Segment[] = [];
  let start = 0;
  let quote: '"' | "'" | '`' | undefined;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sourceText.length; i++) {
    const ch = sourceText[i];
    const next = sourceText[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (quote) {
      if (ch === '\\' && quote !== '`') {
        i++;
        continue;
      }
      if (ch === quote) {
        quote = undefined;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '|') {
      segments.push({ start, end: i });
      start = i + 1;
    }
  }

  segments.push({ start, end: sourceText.length });
  return segments;
}

function readFieldPath(sourceText: string, index: number, end: number): Identifier | undefined {
  const readSegment = (cursor: number): Identifier | undefined => {
    if (sourceText[cursor] === '`') {
      const close = sourceText.indexOf('`', cursor + 1);
      if (close === -1 || close >= end || close === cursor + 1) {
        return undefined;
      }
      return { text: sourceText.slice(cursor, close + 1), end: close + 1 };
    }

    return readIdentifier(sourceText, cursor, end);
  };

  const first = readSegment(index);
  if (!first) {
    return undefined;
  }

  let cursor = first.end;
  while (cursor < end && sourceText[cursor] === '.') {
    const next = readSegment(cursor + 1);
    if (!next) {
      break;
    }
    cursor = next.end;
  }

  return { text: sourceText.slice(index, cursor), end: cursor };
}

function hasFieldSlotBoundary(sourceText: string, index: number, end: number): boolean {
  if (index >= end) {
    return true;
  }

  return (
    /\s/.test(sourceText[index]) ||
    (sourceText[index] === '/' && (sourceText[index + 1] === '/' || sourceText[index + 1] === '*'))
  );
}

function positionAt(lineStarts: number[], offset: number): { line: number; column: number } {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const next = lineStarts[mid + 1] ?? Infinity;
    if (offset < lineStarts[mid]) {
      high = mid - 1;
    } else if (offset >= next) {
      low = mid + 1;
    } else {
      return { line: mid + 1, column: offset - lineStarts[mid] };
    }
  }

  return { line: 1, column: offset };
}

function rangeFromOffsets(
  lineStarts: number[],
  startOffset: number,
  endOffset: number
): DiagnosticRange {
  const start = positionAt(lineStarts, startOffset);
  const end = positionAt(lineStarts, endOffset);
  return {
    startLine: start.line,
    startColumn: start.column,
    endLine: end.line,
    endColumn: end.column,
  };
}

function lineStartsFor(sourceText: string): number[] {
  const starts = [0];
  for (let i = 0; i < sourceText.length; i++) {
    if (sourceText[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

export function findCompiledFieldSlotShapeMatches(sourceText: string): FieldSlotShapeMatch[] {
  const lineStarts = lineStartsFor(sourceText);
  const matches: FieldSlotShapeMatch[] = [];

  for (const segment of splitCommandSegments(sourceText)) {
    const commandStart = skipTrivia(sourceText, segment.start, segment.end);
    const command = readIdentifier(sourceText, commandStart, segment.end);
    const commandInfo = command ? COMMANDS[command.text.toLowerCase()] : undefined;
    if (!command || !commandInfo) {
      continue;
    }

    let cursor = skipTrivia(sourceText, command.end, segment.end);
    const fieldKeyword = readIdentifier(sourceText, cursor, segment.end);
    if (!fieldKeyword || fieldKeyword.text.toLowerCase() !== 'field') {
      continue;
    }

    cursor = skipTrivia(sourceText, fieldKeyword.end, segment.end);
    if (sourceText[cursor] !== '=') {
      continue;
    }

    cursor++;
    if (sourceText[cursor] === '=') {
      cursor++;
    }

    cursor = skipTrivia(sourceText, cursor, segment.end);
    const rhs = readFieldPath(sourceText, cursor, segment.end);
    if (!rhs || !hasFieldSlotBoundary(sourceText, rhs.end, segment.end)) {
      continue;
    }

    const rangeStart = fieldKeyword.end - fieldKeyword.text.length;
    const rangeEnd = rhs.end;
    matches.push({
      ...commandInfo,
      expressionText: sourceText.slice(rangeStart, rangeEnd),
      replacement: rhs.text,
      range: rangeFromOffsets(lineStarts, rangeStart, rangeEnd),
    });
  }

  return matches;
}
