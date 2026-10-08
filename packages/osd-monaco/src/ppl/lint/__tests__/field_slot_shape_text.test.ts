/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findCompiledFieldSlotShapeMatches } from '../field_slot_shape_text';

const replacements = (query: string): Array<string | undefined> =>
  findCompiledFieldSlotShapeMatches(query).map((match) => match.replacement);

describe('compiled field-slot shape text detector', () => {
  it('detects grok field=body and reports a precise replacement range', () => {
    const query = 'source=logs | grok field=body "%{WORD:first}"';
    const [match] = findCompiledFieldSlotShapeMatches(query);

    expect(match.keyword).toBe('grok');
    expect(match.commandName).toBe('grokCommand');
    expect(match.expressionText).toBe('field=body');
    expect(match.replacement).toBe('body');
    expect(match.range).toEqual({
      startLine: 1,
      startColumn: query.indexOf('field=body'),
      endLine: 1,
      endColumn: query.indexOf('field=body') + 'field=body'.length,
    });
  });

  it('detects spaced and case-insensitive parse/patterns forms', () => {
    expect(replacements('source=logs | parse field = message "x"')).toEqual(['message']);
    expect(replacements('source=logs | PATTERNS field=body')).toEqual(['body']);
    expect(replacements('source=logs | Grok Field=body "x"')).toEqual(['body']);
  });

  it('supports backtick-quoted field paths', () => {
    expect(replacements('source=logs | grok field=`body.with.dot` "x"')).toEqual([
      '`body.with.dot`',
    ]);
    expect(replacements('source=logs | grok field=body.`nested-name` "x"')).toEqual([
      'body.`nested-name`',
    ]);
  });

  it('does not flag valid or ambiguous source-field shapes', () => {
    expect(findCompiledFieldSlotShapeMatches('source=logs | grok body "x"')).toEqual([]);
    expect(findCompiledFieldSlotShapeMatches('source=logs | rex field=body "x"')).toEqual([]);
    expect(findCompiledFieldSlotShapeMatches('source=logs | grok fieldName=body "x"')).toEqual([]);
    expect(findCompiledFieldSlotShapeMatches('source=logs | grok field= "x"')).toEqual([]);
    expect(findCompiledFieldSlotShapeMatches('source=logs | grok field=body+other "x"')).toEqual(
      []
    );
  });

  it('ignores commands inside quoted strings and comments', () => {
    expect(
      findCompiledFieldSlotShapeMatches('source=logs | eval x = "grok field=body" | head 1')
    ).toEqual([]);
    expect(findCompiledFieldSlotShapeMatches('source=logs | // grok field=body\n head 1')).toEqual(
      []
    );
    expect(findCompiledFieldSlotShapeMatches('source=logs | /* grok field=body */ head 1')).toEqual(
      []
    );
  });

  it('keeps pipe splitting out of strings, backticks, and comments', () => {
    expect(
      findCompiledFieldSlotShapeMatches('source=logs | eval x = "a | grok field=body" | head 1')
    ).toEqual([]);
    expect(replacements('source=logs | fields `a|b` | grok field=body "x"')).toEqual(['body']);
  });

  it('computes multiline ranges in ANTLR column coordinates', () => {
    const query = 'source=logs |\n  grok field =\n    body "x"';
    const [match] = findCompiledFieldSlotShapeMatches(query);

    expect(match.range).toEqual({
      startLine: 2,
      startColumn: 7,
      endLine: 3,
      endColumn: 8,
    });
  });
});
