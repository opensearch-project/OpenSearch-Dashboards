/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PROMQL_FREE_TEXT_OPTION,
  DEFAULT_PROMQL_LABEL_FILTER_ROW,
  createDefaultResourceQuery,
  ensureResourceQueryHasDefaultMatcherRow,
} from './promql_query_type_selector';
import { PromQLResourceQuery } from '../../../../../variables/types';

describe('createDefaultResourceQuery', () => {
  it('returns a bare labelNames query type', () => {
    expect(createDefaultResourceQuery('labelNames')).toEqual({ kind: 'labelNames' });
  });

  it('returns a metrics query type', () => {
    expect(createDefaultResourceQuery('metrics')).toEqual({ kind: 'metrics' });
  });

  it('returns a series query type with an empty matcher', () => {
    expect(createDefaultResourceQuery('series')).toEqual({ kind: 'series', matcher: '' });
  });

  it('seeds labelValues with an empty label and one default Label filter row', () => {
    expect(createDefaultResourceQuery('labelValues')).toEqual({
      kind: 'labelValues',
      label: '',
      matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }],
    });
  });

  it('returns a fresh matcher-row array each call (no shared reference)', () => {
    const first = createDefaultResourceQuery('labelValues') as Extract<
      PromQLResourceQuery,
      { kind: 'labelValues' }
    >;
    const second = createDefaultResourceQuery('labelValues') as Extract<
      PromQLResourceQuery,
      { kind: 'labelValues' }
    >;

    expect(first.matchers).not.toBe(second.matchers);
    expect(first.matchers![0]).not.toBe(second.matchers![0]);
  });

  it('returns undefined for the free-text option', () => {
    expect(createDefaultResourceQuery(PROMQL_FREE_TEXT_OPTION)).toBeUndefined();
  });
});

describe('ensureResourceQueryHasDefaultMatcherRow', () => {
  it('passes undefined (free-text) through unchanged', () => {
    expect(ensureResourceQueryHasDefaultMatcherRow(undefined)).toBeUndefined();
  });

  it('leaves non-labelValues query types untouched', () => {
    const labelNames: PromQLResourceQuery = { kind: 'labelNames' };
    const metrics: PromQLResourceQuery = { kind: 'metrics', metricRegex: 'node_.*' };
    const series: PromQLResourceQuery = { kind: 'series', matcher: 'up' };

    expect(ensureResourceQueryHasDefaultMatcherRow(labelNames)).toBe(labelNames);
    expect(ensureResourceQueryHasDefaultMatcherRow(metrics)).toBe(metrics);
    expect(ensureResourceQueryHasDefaultMatcherRow(series)).toBe(series);
  });

  it('adds a default matcher row when labelValues has no matchers', () => {
    const result = ensureResourceQueryHasDefaultMatcherRow({ kind: 'labelValues', label: 'job' });

    expect(result).toEqual({
      kind: 'labelValues',
      label: 'job',
      matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }],
    });
  });

  it('adds a default matcher row when labelValues has an empty matchers array', () => {
    const result = ensureResourceQueryHasDefaultMatcherRow({
      kind: 'labelValues',
      label: 'job',
      matchers: [],
    });

    expect(result).toEqual({
      kind: 'labelValues',
      label: 'job',
      matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }],
    });
  });

  it('leaves labelValues with existing matchers untouched', () => {
    const withMatchers: PromQLResourceQuery = {
      kind: 'labelValues',
      label: 'job',
      matchers: [{ label: 'instance', operator: '=', value: 'localhost' }],
    };

    expect(ensureResourceQueryHasDefaultMatcherRow(withMatchers)).toBe(withMatchers);
  });
});
