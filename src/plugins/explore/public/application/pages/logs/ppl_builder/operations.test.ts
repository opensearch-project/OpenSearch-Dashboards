/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AGG_FUNCTIONS,
  AGG_FN_MAP,
  SCALAR_FN_CATEGORIES,
  SCALAR_FN_MAP,
  SCALAR_FN_IDS,
} from './operations';
import { AggFn } from './types';

describe('AGG_FUNCTIONS', () => {
  it('includes count without a field requirement', () => {
    const count = AGG_FUNCTIONS.find((a) => a.id === 'count');
    expect(count).toBeDefined();
    expect(count!.needsField).toBe(false);
    expect(count!.numericOnly).toBeUndefined();
  });

  it('marks numeric-only aggregations that need a field', () => {
    const numericOnly = [
      'sum',
      'avg',
      'percentile',
      'median',
      'stddev_samp',
      'stddev_pop',
      'var_samp',
      'var_pop',
    ];
    numericOnly.forEach((id) => {
      const def = AGG_FUNCTIONS.find((a) => a.id === id);
      expect(def).toBeDefined();
      expect(def!.numericOnly).toBe(true);
      expect(def!.needsField).toBe(true);
    });
  });

  it('offers min/max/distinct_count over any aggregatable field (needsField, not numericOnly)', () => {
    ['min', 'max', 'distinct_count'].forEach((id) => {
      const def = AGG_FUNCTIONS.find((a) => a.id === id);
      expect(def).toBeDefined();
      expect(def!.needsField).toBe(true);
      expect(def!.numericOnly).toBeUndefined();
    });
  });

  it('gives every aggregation a non-empty label and description', () => {
    AGG_FUNCTIONS.forEach((def) => {
      expect(typeof def.label).toBe('string');
      expect(def.label.length).toBeGreaterThan(0);
      expect(typeof def.description).toBe('string');
      expect(def.description.length).toBeGreaterThan(0);
    });
  });

  it('has unique aggregation ids', () => {
    const ids = AGG_FUNCTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('AGG_FN_MAP', () => {
  it('maps every aggregation id to its definition', () => {
    AGG_FUNCTIONS.forEach((def) => {
      expect(AGG_FN_MAP[def.id]).toBe(def);
    });
  });

  it('has the same number of entries as AGG_FUNCTIONS', () => {
    expect(Object.keys(AGG_FN_MAP).length).toBe(AGG_FUNCTIONS.length);
  });

  it('resolves a known id', () => {
    expect(AGG_FN_MAP['avg' as AggFn].id).toBe('avg');
  });
});

describe('SCALAR_FN_CATEGORIES', () => {
  it('groups scalar functions into Math, String and Date & time categories', () => {
    expect(SCALAR_FN_CATEGORIES).toHaveLength(3);
    SCALAR_FN_CATEGORIES.forEach((cat) => {
      expect(typeof cat.name).toBe('string');
      expect(cat.name.length).toBeGreaterThan(0);
      expect(cat.items.length).toBeGreaterThan(0);
    });
  });

  it('gives every scalar function a params array and non-empty id/name/description', () => {
    SCALAR_FN_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        expect(item.id.length).toBeGreaterThan(0);
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        expect(Array.isArray(item.params)).toBe(true);
      });
    });
  });

  it('emits id equal to name for each scalar function (id is emitted verbatim)', () => {
    SCALAR_FN_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        expect(item.id).toBe(item.name);
      });
    });
  });

  it('provides paramNames matching params for functions with extra args', () => {
    const round = SCALAR_FN_MAP.round;
    expect(round.params).toEqual(['']);
    expect(round.paramNames).toHaveLength(1);

    const substring = SCALAR_FN_MAP.substring;
    expect(substring.params).toEqual(['1', '']);
    expect(substring.paramNames).toHaveLength(2);
  });

  it('has no params for simple single-arg functions', () => {
    expect(SCALAR_FN_MAP.abs.params).toEqual([]);
    expect(SCALAR_FN_MAP.lower.params).toEqual([]);
  });
});

describe('SCALAR_FN_MAP', () => {
  it('maps every scalar function id to its definition', () => {
    const total = SCALAR_FN_CATEGORIES.reduce((n, cat) => n + cat.items.length, 0);
    expect(Object.keys(SCALAR_FN_MAP).length).toBe(total);
    SCALAR_FN_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        expect(SCALAR_FN_MAP[item.id]).toBe(item);
      });
    });
  });
});

describe('SCALAR_FN_IDS', () => {
  it('is a Set containing exactly the keys of SCALAR_FN_MAP', () => {
    expect(SCALAR_FN_IDS instanceof Set).toBe(true);
    expect(SCALAR_FN_IDS.size).toBe(Object.keys(SCALAR_FN_MAP).length);
    Object.keys(SCALAR_FN_MAP).forEach((id) => {
      expect(SCALAR_FN_IDS.has(id)).toBe(true);
    });
  });

  it('recognizes known ids and rejects unknown ones', () => {
    expect(SCALAR_FN_IDS.has('round')).toBe(true);
    expect(SCALAR_FN_IDS.has('not_a_function')).toBe(false);
  });
});
