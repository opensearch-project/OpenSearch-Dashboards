/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildPPLCommandRegex,
  getPPLCommandsWhere,
  maskedPPLQueryHasTrait,
  PPL_COMMAND_TRAITS,
  PPL_PATTERNS_AGGREGATION_MODE_REGEX,
  PPL_PATTERNS_AGGREGATION_TRAITS,
  PPL_PATTERNS_NOT_LABEL_MODE_REGEX,
  PPL_PATTERNS_WITHOUT_MODE_REGEX,
  getPPLPatternsAggregationRegex,
  getPPLPatternsMayAggregateRegex,
  PPLCommandTraits,
} from './ppl_command_traits';

const allTraits: Array<[string, PPLCommandTraits]> = [
  ...Object.entries(PPL_COMMAND_TRAITS),
  ['patterns mode=aggregation', PPL_PATTERNS_AGGREGATION_TRAITS],
];

describe('PPL command traits', () => {
  // These invariants are what keep the consumers from drifting apart: a command added with an
  // inconsistent combination fails here instead of showing users the wrong data.
  it.each(allTraits)('%s: a command stripped from the Logs query is routed off Logs', (_, t) => {
    if (t.stripsFromHistogram) {
      expect(t.routesTo).toBeDefined();
    }
  });

  it.each(allTraits)('%s: only aggregations can be bucket-countable', (_, t) => {
    if (t.isBucketCountable) {
      expect(t.isAggregation).toBe(true);
    }
  });

  it.each(allTraits)('%s: an aggregation is stripped and blocks the default sort', (_, t) => {
    if (t.isAggregation) {
      expect(t.stripsFromHistogram).toBe(true);
      expect(t.blocksDefaultSort).toBe(true);
    }
  });

  it('excludes only timewrap from the bucket-count probe', () => {
    expect(getPPLCommandsWhere((t) => t.isAggregation && !t.isBucketCountable)).toEqual([
      'timewrap',
    ]);
  });

  it('keeps table as a routed projection rather than an aggregation', () => {
    expect(PPL_COMMAND_TRAITS.table).toMatchObject({
      routesTo: 'statistics',
      stripsFromHistogram: false,
      isAggregation: false,
    });
  });
});

describe('buildPPLCommandRegex', () => {
  it('matches a top-level command case-insensitively on a word boundary', () => {
    const regex = buildPPLCommandRegex(['stats', 'top']);
    expect(regex.test('source=x | STATS count()')).toBe(true);
    expect(regex.test('source=x |top 5 a')).toBe(true);
    expect(regex.test('source=x | where topic = 1')).toBe(false);
  });

  it('matches a command that starts the query, for languages without a source clause', () => {
    const regex = buildPPLCommandRegex(['stats']);
    expect(regex.test('stats count(*) by host')).toBe(true);
    expect(regex.test('\n  STATS count(*)')).toBe(true);
    expect(regex.test('statsfield = 1')).toBe(false);
    expect(regex.test('fields stats')).toBe(false);
  });

  it('does not match a leading field of the same name used in a search expression', () => {
    // Explore runs editor text without a source clause as `source = <dataset> <text>`, so these
    // are filters on a field, not commands.
    const regex = buildPPLCommandRegex(['stats', 'top', 'table', 'timechart']);
    expect(regex.test('top > 10')).toBe(false);
    expect(regex.test('stats = 1')).toBe(false);
    expect(regex.test("table = 'orders'")).toBe(false);
    expect(regex.test('top<=10')).toBe(false);
    // A field path, or a field before `in`, `like` or `is`.
    expect(regex.test("table.name = 'checkout'")).toBe(false);
    expect(regex.test('top[0] > 1')).toBe(false);
    expect(regex.test('top in (1, 2)')).toBe(false);
    expect(regex.test("table like 'orders%'")).toBe(false);
    expect(regex.test('stats is null')).toBe(false);
    // Still commands.
    expect(regex.test('timechart span=1d count()')).toBe(true);
    expect(regex.test('top 5 host')).toBe(true);
    expect(regex.test('stats count(*) by host')).toBe(true);
    expect(regex.test('table a, b')).toBe(true);
    expect(regex.test('source=x | top 5 host')).toBe(true);
  });

  it('with toEnd, does not match a command that starts the query', () => {
    // Cutting there would leave an empty query.
    expect(buildPPLCommandRegex(['stats'], { toEnd: true }).test('stats count(*) by host')).toBe(
      false
    );
  });

  it('with toEnd, matches from the whitespace before the pipe to the end', () => {
    const query = 'source=x | where a > 1  | stats count()\n| head 5';
    const match = query.match(buildPPLCommandRegex(['stats'], { toEnd: true }));
    expect(query.slice(0, match?.index)).toBe('source=x | where a > 1');
  });

  it('matches the longer command when one name is a prefix of another', () => {
    // \b makes the engine backtrack past the shorter alternative, so order doesn't matter.
    expect(buildPPLCommandRegex(['top', 'toplevel']).test('source=x | toplevel a')).toBe(true);
    expect(buildPPLCommandRegex(['top']).test('source=x | toplevel a')).toBe(false);
  });

  // An empty alternation would build `\|\s*()\b`, which matches any pipe.
  it.each([false, true])('never matches for an empty command list (toEnd=%s)', (toEnd) => {
    const regex = buildPPLCommandRegex([], { toEnd });
    expect(regex.test('source=x | where a = 1')).toBe(false);
    expect(regex.test('source=x | stats count()')).toBe(false);
    expect('source=x | where a = 1'.search(regex)).toBe(-1);
  });
});

describe('patterns mode regexes', () => {
  it.each([
    ['source=x | patterns message mode=aggregation', true, true],
    ['source=x | patterns message MODE = AGGREGATION', true, true],
    ['source=x | patterns message', false, true],
    ['source=x | patterns message method=brain', false, true],
    ['source=x | patterns message mode=label', false, false],
    ['source=x | patterns message | eval mode=aggregation', false, true],
    ['source=x | where a = 1', false, false],
  ])('%s: aggregation=%s, notLabel=%s', (query, isAggregationMode, isNotLabelMode) => {
    expect(PPL_PATTERNS_AGGREGATION_MODE_REGEX.test(query)).toBe(isAggregationMode);
    expect(PPL_PATTERNS_NOT_LABEL_MODE_REGEX.test(query)).toBe(isNotLabelMode);
  });
});

describe('maskedPPLQueryHasTrait', () => {
  it('matches commands from the table and aggregation-mode patterns', () => {
    const isAggregation = (t: PPLCommandTraits) => t.isAggregation;
    expect(maskedPPLQueryHasTrait('source=x | transpose', isAggregation)).toBe(true);
    expect(maskedPPLQueryHasTrait('source=x | patterns m mode=aggregation', isAggregation)).toBe(
      true
    );
    expect(maskedPPLQueryHasTrait('source=x | patterns m', isAggregation)).toBe(false);
    expect(maskedPPLQueryHasTrait('source=x | table a', isAggregation)).toBe(false);
  });

  it('is false for any query when no command has the trait', () => {
    const noCommand = () => false;
    expect(getPPLCommandsWhere(noCommand)).toEqual([]);
    expect(maskedPPLQueryHasTrait('source=x | where a = 1', noCommand)).toBe(false);
    expect(maskedPPLQueryHasTrait('source=x | stats count()', noCommand)).toBe(false);
  });
});

describe('patterns default mode', () => {
  const BARE = 'source=x | patterns message';
  const LABEL = 'source=x | patterns message mode=label';
  const AGGREGATION = 'source=x | patterns message mode=aggregation';

  it.each([
    [BARE, true],
    ['source=x | patterns message method=brain', true],
    [LABEL, false],
    [AGGREGATION, false],
    // a mode= on a later stage belongs to that stage, so this patterns still has no mode
    ['source=x | patterns message | eval mode=1', true],
    ['source=x | where a = 1', false],
  ])('PPL_PATTERNS_WITHOUT_MODE_REGEX on %s is %s', (query, expected) => {
    expect(PPL_PATTERNS_WITHOUT_MODE_REGEX.test(query)).toBe(expected);
  });

  // [default mode, bare aggregates?, explicit label aggregates?, explicit aggregation aggregates?]
  it.each([
    ['label', false, false, true],
    ['aggregation', true, false, true],
    // unknown assumes the engine default (label) for data decisions
    [undefined, false, false, true],
  ] as const)(
    'getPPLPatternsAggregationRegex(%s): bare=%s label=%s aggregation=%s',
    (mode, bare, label, aggregation) => {
      const regex = getPPLPatternsAggregationRegex(mode);
      expect(regex.test(BARE)).toBe(bare);
      expect(regex.test(LABEL)).toBe(label);
      expect(regex.test(AGGREGATION)).toBe(aggregation);
    }
  );

  it.each([
    ['label', false, false, true],
    ['aggregation', true, false, true],
    // unknown assumes a bare patterns may aggregate, to avoid a query error
    [undefined, true, false, true],
  ] as const)(
    'getPPLPatternsMayAggregateRegex(%s): bare=%s label=%s aggregation=%s',
    (mode, bare, label, aggregation) => {
      const regex = getPPLPatternsMayAggregateRegex(mode);
      expect(regex.test(BARE)).toBe(bare);
      expect(regex.test(LABEL)).toBe(label);
      expect(regex.test(AGGREGATION)).toBe(aggregation);
    }
  );

  it('maskedPPLQueryHasTrait treats a bare patterns as an aggregation only when the default is', () => {
    const isAggregation = (t: PPLCommandTraits) => t.isAggregation;
    expect(maskedPPLQueryHasTrait(BARE, isAggregation)).toBe(false);
    expect(maskedPPLQueryHasTrait(BARE, isAggregation, { patternsDefaultMode: 'label' })).toBe(
      false
    );
    expect(
      maskedPPLQueryHasTrait(BARE, isAggregation, { patternsDefaultMode: 'aggregation' })
    ).toBe(true);
    expect(
      maskedPPLQueryHasTrait(LABEL, isAggregation, { patternsDefaultMode: 'aggregation' })
    ).toBe(false);
  });

  it('slicing at a match removes the patterns stage and the whitespace before it', () => {
    const query = 'source=x | where a > 1  | patterns message | head 5';
    const index = query.search(getPPLPatternsAggregationRegex('aggregation'));
    expect(query.slice(0, index)).toBe('source=x | where a > 1');
  });
});
