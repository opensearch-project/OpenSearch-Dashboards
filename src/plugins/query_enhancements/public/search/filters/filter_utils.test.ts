/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExistsFilter,
  Filter,
  IIndexPattern,
  PhrasesFilter,
  RangeFilter,
  RangeFilterParams,
  TimeRange,
} from '../../../../data/common';
import { FilterUtils } from './filter_utils';

const getPhraseFilter = (): Filter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    key: 'field1',
    negate: false,
    params: { query: 'test' },
    type: 'phrase',
  },
  query: { match_phrase: { field1: 'test' } },
});

const getPhrasesFilter = (): PhrasesFilter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    key: 'field1',
    negate: false,
    params: ['a', 'b', 'c'],
    type: 'phrases',
    value: 'a, b, c',
  },
  query: {
    bool: {
      should: [
        { match_phrase: { category: 'a' } },
        { match_phrase: { category: 'b' } },
        { match_phrase: { category: 'c' } },
      ],
      minimum_should_match: 1,
    },
  },
});

const getRangeFilter = (params: RangeFilterParams): RangeFilter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    key: 'range_field',
    negate: false,
    params,
    type: 'range',
  },
  range: { range_field: params },
});

const getExistsFilter = (): ExistsFilter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    key: 'field1',
    negate: false,
    type: 'exists',
  },
  exists: {
    field: 'category.keyword',
  },
});

const disable = (filter: Filter) => {
  filter.meta.disabled = true;
  return filter;
};

const negate = (filter: Filter) => {
  filter.meta.negate = true;
  return filter;
};

const mockIndexPattern: IIndexPattern = {
  id: 'mock-index',
  title: 'mock-index',
  fields: {
    getByName: jest.fn(),
    getAll: () => [],
    some: (predicate: (field: any) => boolean) => {
      const fields = [{ name: 'field1' }, { name: 'range_field' }, { name: 'category' }];
      return fields.some(predicate);
    },
  } as any,
};

describe('convertFiltersToClause', () => {
  beforeEach(() => {});

  it('should return empty string for empty filters array', () => {
    expect(FilterUtils.convertFiltersToWhereClause([], undefined)).toBe('');
  });

  it('should skip disabled filters', () => {
    const filters: Filter[] = [disable(getPhraseFilter())];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe('');
  });

  it('should handle phrase filter', () => {
    const filters: Filter[] = [getPhraseFilter()];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE `field1` = 'test'"
    );
  });

  it('should handle negated phrase filter', () => {
    const filters: Filter[] = [negate(getPhraseFilter())];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE `field1` != 'test'"
    );
  });

  it('should handle phrases filter', () => {
    const filters: Filter[] = [negate(getPhrasesFilter()), getPhrasesFilter()];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE (`field1` != 'a' AND `field1` != 'b' AND `field1` != 'c') AND (`field1` = 'a' OR `field1` = 'b' OR `field1` = 'c')"
    );
  });

  it('should handle range filter', () => {
    const filters: Filter[] = [
      negate(getRangeFilter({ gte: 5, lt: 10 })),
      getRangeFilter({ gte: 5, lt: 10 }),
      getRangeFilter({ gte: 4 }),
      getRangeFilter({ lt: 11 }),
    ];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      'WHERE (`range_field` < 5 OR `range_field` >= 10) AND (`range_field` >= 5 AND `range_field` < 10) AND (`range_field` >= 4) AND (`range_field` < 11)'
    );
  });

  it('should handle exists filter', () => {
    const filters: Filter[] = [getExistsFilter()];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      'WHERE ISNOTNULL(`category`)'
    );
  });

  it('should handle negated exists filter', () => {
    const filters: Filter[] = [negate(getExistsFilter())];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      'WHERE ISNULL(`category`)'
    );
  });

  it('should handle multiple filters', () => {
    const filters: Filter[] = [getPhraseFilter(), getRangeFilter({ gte: 1, lt: 10 })];
    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE (`field1` = 'test') AND (`range_field` >= 1 AND `range_field` < 10)"
    );
  });

  it('should escape single quotes in phrase queries', () => {
    const filter = getPhraseFilter();
    filter.meta.params.query = "test's";
    filter.query.match_phrase.field1 = "test's";
    const filters: Filter[] = [filter];

    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE `field1` = 'test''s'"
    );
  });

  it('should not quote non-string values in phrase queries', () => {
    const filter = getPhraseFilter();
    filter.meta.params.query = 123;
    filter.query.match_phrase.field1 = 123;
    const filters: Filter[] = [filter];

    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      'WHERE `field1` = 123'
    );
  });

  it('should remove .keyword suffix from field names', () => {
    const filter = getPhraseFilter();
    filter.meta.params.key = 'field1.keyword';
    filter.query.match_phrase['field1.keyword'] = filter.query.match_phrase.field1;
    const filters: Filter[] = [filter];

    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe(
      "WHERE `field1` = 'test'"
    );
  });

  it('ignores custom DSL filters', () => {
    const filters: Filter[] = [
      {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          key: 'query',
          negate: false,
          type: 'custom',
          value: '{"prefix":{"field1.keyword":"test\'s"}}',
        },
        query: { prefix: { 'field1.keyword': "test's" } },
      },
    ];

    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined)).toBe('');
  });

  it('should filter out fields not in index pattern when ignoreFilterIfFieldNotInIndex is true', () => {
    const filters: Filter[] = [
      getPhraseFilter(),
      {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          key: 'non_existent_field',
          negate: false,
          params: { query: 'test' },
          type: 'phrase',
        },
        query: { match_phrase: { non_existent_field: 'test' } },
      },
    ];

    expect(FilterUtils.convertFiltersToWhereClause(filters, mockIndexPattern, true)).toBe(
      "WHERE `field1` = 'test'"
    );
  });

  it('should not filter out any fields when ignoreFilterIfFieldNotInIndex is false', () => {
    const filters: Filter[] = [
      getPhraseFilter(),
      {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          key: 'non_existent_field',
          negate: false,
          params: { query: 'test' },
          type: 'phrase',
        },
        query: { match_phrase: { non_existent_field: 'test' } },
      },
    ];

    expect(FilterUtils.convertFiltersToWhereClause(filters, mockIndexPattern, false)).toBe(
      "WHERE (`field1` = 'test') AND (`non_existent_field` = 'test')"
    );
  });

  it('should include all fields when no indexPattern is provided even with ignoreFilterIfFieldNotInIndex=true', () => {
    const filters: Filter[] = [
      getPhraseFilter(),
      {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          key: 'non_existent_field',
          negate: false,
          params: { query: 'test' },
          type: 'phrase',
        },
        query: { match_phrase: { non_existent_field: 'test' } },
      },
    ];

    expect(FilterUtils.convertFiltersToWhereClause(filters, undefined, true)).toBe(
      "WHERE (`field1` = 'test') AND (`non_existent_field` = 'test')"
    );
  });
});

describe('getTimeFilterCommand', () => {
  const timeRange: TimeRange = {
    from: '2023-01-01T00:00:00Z',
    to: '2023-01-02T00:00:00Z',
  };

  it('emits bare string literals for OpenSearch (folds to a native range query, no scripts)', () => {
    const result = FilterUtils.getTimeFilterWhereClause('timestamp', timeRange, 'OpenSearch');
    expect(result).toBe(
      "WHERE `timestamp` >= '2023-01-01 00:00:00.000' AND `timestamp` <= '2023-01-02 00:00:00.000'"
    );
  });

  it('defaults to bare string literals when the engine type is unknown/undefined (fail-open)', () => {
    const result = FilterUtils.getTimeFilterWhereClause('timestamp', timeRange);
    expect(result).toBe(
      "WHERE `timestamp` >= '2023-01-01 00:00:00.000' AND `timestamp` <= '2023-01-02 00:00:00.000'"
    );
  });

  it('wraps literals in TIMESTAMP() for legacy Elasticsearch (Open Distro rejects bare strings)', () => {
    const result = FilterUtils.getTimeFilterWhereClause('timestamp', timeRange, 'Elasticsearch');
    expect(result).toBe(
      "WHERE `timestamp` >= TIMESTAMP('2023-01-01 00:00:00.000') AND `timestamp` <= TIMESTAMP('2023-01-02 00:00:00.000')"
    );
  });
  it('reports bounds that match the literals in the where clause', () => {
    const bounds = FilterUtils.getTimeFilterBounds('timestamp', timeRange);

    expect(bounds).toEqual({
      field: 'timestamp',
      from: '2023-01-01 00:00:00.000',
      to: '2023-01-02 00:00:00.000',
    });
  });

  // The engine prunes indices with these bounds while the clause does the filtering, so the two
  // describing different windows could drop an index the filter would have matched. Both engine
  // flavors reach this code, and they quote the literals differently.
  it.each([['OpenSearch'], ['Elasticsearch'], [undefined]])(
    'embeds exactly the reported bounds in the clause for engine %s',
    (engineType) => {
      const bounds = FilterUtils.getTimeFilterBounds('timestamp', timeRange)!;
      const clause = FilterUtils.getTimeFilterWhereClause('timestamp', timeRange, engineType);

      expect(clause).toContain(bounds.from);
      expect(clause).toContain(bounds.to);
    }
  );

  it('reports no bounds when the range does not parse, rather than NaN text', () => {
    // An unparseable range does not fail loudly: datemath yields either '' or an invalid moment
    // that formats as the literal 'Invalid date'. Formatting that as a date used to yield
    // 'NaN-aN-aN aN:aN:aN.NaN', which would then be shipped as a bound.
    expect(
      FilterUtils.getTimeFilterBounds('timestamp', { from: 'nonsense', to: 'now' })
    ).toBeUndefined();
    expect(
      FilterUtils.getTimeFilterBounds('timestamp', { from: 'now-15m', to: 'nonsense' })
    ).toBeUndefined();
  });

  it('keeps a bound that falls inside a DST spring-forward gap', () => {
    // formatTimePickerDate emits UTC. Re-parsing that as local time shifted a bound an hour when
    // the wall-clock value does not exist locally (02:30 on a US spring-forward morning).
    const bounds = FilterUtils.getTimeFilterBounds('timestamp', {
      from: '2026-03-08T02:30:00Z',
      to: '2026-03-08T03:30:00Z',
    });

    expect(bounds).toEqual({
      field: 'timestamp',
      from: '2026-03-08 02:30:00.000',
      to: '2026-03-08 03:30:00.000',
    });
  });
});
