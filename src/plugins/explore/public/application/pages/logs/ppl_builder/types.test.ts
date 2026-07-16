/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { emptyState, nextAggId, nextFilterId } from './types';

describe('emptyState', () => {
  it('returns a blank builder state', () => {
    const state = emptyState();
    expect(state).toEqual({
      searchExpression: '',
      filters: [],
      aggregations: [],
      groupBy: { fields: [] },
    });
    expect(state.sort).toBeUndefined();
  });

  it('returns a fresh object each call (no shared references)', () => {
    const a = emptyState();
    const b = emptyState();
    expect(a).not.toBe(b);
    expect(a.aggregations).not.toBe(b.aggregations);
    expect(a.groupBy).not.toBe(b.groupBy);
    expect(a.groupBy.fields).not.toBe(b.groupBy.fields);

    // Mutating one must not leak into a subsequent empty state.
    a.aggregations.push({ id: 'x', fn: 'count' });
    a.groupBy.fields.push('service');
    expect(emptyState().aggregations).toEqual([]);
    expect(emptyState().groupBy.fields).toEqual([]);
  });
});

describe('nextAggId', () => {
  it('produces the ag- prefixed pattern', () => {
    expect(nextAggId()).toMatch(/^ag-\d+$/);
  });

  it('increments monotonically and never repeats consecutively', () => {
    const first = nextAggId();
    const second = nextAggId();
    expect(first).not.toBe(second);

    const n1 = Number(first.slice('ag-'.length));
    const n2 = Number(second.slice('ag-'.length));
    expect(n2).toBe(n1 + 1);
  });
});

describe('nextFilterId', () => {
  it('produces the flt- prefixed pattern and is unique per call', () => {
    const first = nextFilterId();
    const second = nextFilterId();
    expect(first).toMatch(/^flt-\d+$/);
    expect(first).not.toBe(second);
  });
});
