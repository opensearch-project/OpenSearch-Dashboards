/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { analyzeSearchExpression } from './search_completion';

describe('analyzeSearchExpression', () => {
  it('suggests fields on empty input', () => {
    const a = analyzeSearchExpression('', 0);
    expect(a.suggestFields).toBe(true);
    expect(a.suggestValuesForField).toBeUndefined();
  });

  it.each<[string, string, number, { partial: string; start: number; end: number }]>([
    ['a bare term / field name', 'stat', 4, { partial: 'stat', start: 0, end: 4 }],
    [
      'the start of an existing term (empty range insert)',
      "extension='deb' @timestamp='sample'",
      16,
      { partial: '', start: 16, end: 16 },
    ],
    ['inside a term (replaces its extent)', 'status=500', 3, { partial: 'sta', start: 0, end: 6 }],
  ])('suggests fields at %s', (_label, query, cursor, expected) => {
    const a = analyzeSearchExpression(query, cursor);
    expect(a.suggestFields).toBe(true);
    expect(a.partial).toBe(expected.partial);
    expect(a.replaceStart).toBe(expected.start);
    expect(a.replaceEnd).toBe(expected.end);
  });

  it('suggests comparison operators right after a field', () => {
    const a = analyzeSearchExpression('status ', 7);
    expect(a.keywords).toEqual(expect.arrayContaining(['=', '!=', '>', '>=', '<', '<=']));
  });

  it.each<[string, string, number, string]>([
    ['for the governing field after an operator', 'status=', 7, 'status'],
    ['for the field while typing the value', 'service=web', 11, 'service'],
    ['for the governing field of an IN list', 'severityText IN (', 17, 'severityText'],
    ['for a backtick-quoted field name', '`resource.service`=', 19, '`resource.service`'],
  ])('suggests values %s', (_label, query, cursor, field) => {
    expect(analyzeSearchExpression(query, cursor).suggestValuesForField).toBe(field);
  });

  it('captures the partial value while typing it', () => {
    expect(analyzeSearchExpression('service=web', 11).partial).toBe('web');
  });

  it('suggests boolean keywords after a completed comparison', () => {
    const a = analyzeSearchExpression('status=500 ', 11);
    expect(a.keywords).toEqual(expect.arrayContaining(['AND', 'OR']));
  });

  it('suggests fields again after a boolean keyword', () => {
    expect(analyzeSearchExpression('status=500 AND ', 15).suggestFields).toBe(true);
  });
});
