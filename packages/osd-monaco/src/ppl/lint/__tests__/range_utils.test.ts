/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ParserRuleContext, Token } from 'antlr4ng';
import {
  PIPE_FIRST_PREFIX,
  rangeFromContext,
  rangeFromTokens,
  rangeWithinToken,
  remapPipeFirstColumns,
  unquote,
  wholeQueryRange,
} from '../range_utils';
import { Diagnostic } from '../diagnostic';

// Minimal Token stand-in: range helpers only read line, column, and text.
const token = (line: number, column: number, text: string): Token =>
  (({ line, column, text } as unknown) as Token);

describe('range_utils', () => {
  describe('rangeFromTokens', () => {
    it('spans from the start token to the end of the stop token text', () => {
      const range = rangeFromTokens(token(1, 0, 'source'), token(1, 9, 'head5'));
      expect(range).toEqual({ startLine: 1, startColumn: 0, endLine: 1, endColumn: 14 });
    });

    it('treats missing stop text as empty', () => {
      const range = rangeFromTokens(token(2, 3, 'x'), token(4, 7, undefined as any));
      expect(range).toEqual({ startLine: 2, startColumn: 3, endLine: 4, endColumn: 7 });
    });
  });

  describe('rangeFromContext', () => {
    it('uses the context start and stop tokens', () => {
      const ctx = ({
        start: token(1, 2, 'ab'),
        stop: token(1, 5, 'cde'),
      } as unknown) as ParserRuleContext;
      expect(rangeFromContext(ctx)).toEqual({
        startLine: 1,
        startColumn: 2,
        endLine: 1,
        endColumn: 8,
      });
    });

    it('falls back to the start token when stop is missing', () => {
      const ctx = ({ start: token(3, 4, 'ab'), stop: null } as unknown) as ParserRuleContext;
      expect(rangeFromContext(ctx)).toEqual({
        startLine: 3,
        startColumn: 4,
        endLine: 3,
        endColumn: 6,
      });
    });

    it('returns a 1x1 placeholder when the context has no start token', () => {
      const ctx = ({ start: null } as unknown) as ParserRuleContext;
      expect(rangeFromContext(ctx)).toEqual({
        startLine: 1,
        startColumn: 0,
        endLine: 1,
        endColumn: 1,
      });
    });
  });

  describe('rangeWithinToken', () => {
    it('offsets within a single-line token', () => {
      // token text 'abcd' at line 5 col 10; highlight 'bc' (offset 1, length 2)
      const range = rangeWithinToken(token(5, 10, 'abcd'), 1, 2);
      expect(range).toEqual({ startLine: 5, startColumn: 11, endLine: 5, endColumn: 13 });
    });

    it('accounts for newlines inside a multi-line token', () => {
      // token text 'ab\ncd' at line 3; offset 3 points at 'c' on the second line
      const range = rangeWithinToken(token(3, 4, 'ab\ncd'), 3, 1);
      expect(range).toEqual({ startLine: 4, startColumn: 0, endLine: 4, endColumn: 1 });
    });
  });

  describe('wholeQueryRange', () => {
    it('spans a single-line query', () => {
      expect(wholeQueryRange('source=t')).toEqual({
        startLine: 1,
        startColumn: 0,
        endLine: 1,
        endColumn: 8,
      });
    });

    it('spans a multi-line query to the end of the last line', () => {
      expect(wholeQueryRange('source=t\n| head 5')).toEqual({
        startLine: 1,
        startColumn: 0,
        endLine: 2,
        endColumn: 8,
      });
    });
  });

  describe('unquote', () => {
    it('strips matching double quotes', () => {
      expect(unquote('"abc"')).toBe('abc');
    });

    it('strips matching single quotes', () => {
      expect(unquote("'abc'")).toBe('abc');
    });

    it('leaves an unquoted string untouched', () => {
      expect(unquote('abc')).toBe('abc');
    });

    it('leaves an unbalanced quote untouched', () => {
      expect(unquote('"abc')).toBe('"abc');
    });

    it('does not touch strings shorter than two characters', () => {
      expect(unquote('"')).toBe('"');
    });
  });

  describe('remapPipeFirstColumns', () => {
    const diagnostic = (range: Diagnostic['range']): Diagnostic => ({
      ruleId: 'r',
      severity: 'warning',
      message: 'm',
      range,
    });

    it('shifts first-line columns left by the pipe-first prefix length', () => {
      const prefix = PIPE_FIRST_PREFIX.length;
      const [out] = remapPipeFirstColumns([
        diagnostic({ startLine: 1, startColumn: prefix + 2, endLine: 1, endColumn: prefix + 6 }),
      ]);
      expect(out.range).toEqual({ startLine: 1, startColumn: 2, endLine: 1, endColumn: 6 });
    });

    it('never produces negative columns', () => {
      const [out] = remapPipeFirstColumns([
        diagnostic({ startLine: 1, startColumn: 1, endLine: 1, endColumn: 2 }),
      ]);
      expect(out.range.startColumn).toBe(0);
      expect(out.range.endColumn).toBe(0);
    });

    it('leaves columns on later lines unchanged', () => {
      const [out] = remapPipeFirstColumns([
        diagnostic({ startLine: 2, startColumn: 4, endLine: 2, endColumn: 9 }),
      ]);
      expect(out.range).toEqual({ startLine: 2, startColumn: 4, endLine: 2, endColumn: 9 });
    });
  });
});
