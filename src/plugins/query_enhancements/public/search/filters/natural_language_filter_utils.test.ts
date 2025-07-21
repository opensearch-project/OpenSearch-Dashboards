/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExistsFilter,
  Filter,
  PhrasesFilter,
  RangeFilter,
  RangeFilterParams,
} from '../../../../data/common';
import { NaturalLanguageFilterUtils } from './natural_language_filter_utils';

const getPhraseFilter = (field: string = 'field1', query: string = 'test'): Filter => ({
  meta: {
    alias: null,
    disabled: false,
    index: 'mock-index',
    key: field,
    negate: false,
    params: { query },
    type: 'phrase',
  },
  query: { match_phrase: { [field]: query } },
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
    field: 'field1.keyword',
  },
});

const negate = (filter: Filter) => {
  filter.meta.negate = true;
  return filter;
};

describe('NaturalLanguageFilterUtils', () => {
  describe('toPredicate', () => {
    it('should handle phrase filter', () => {
      const filter = getPhraseFilter();
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe("field1 is 'test'");
    });

    it('should handle negated phrase filter', () => {
      const filter = negate(getPhraseFilter());
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe("field1 is not 'test'");
    });

    it('should handle phrases filter', () => {
      const filter = getPhrasesFilter();
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(
        "field1 is 'a' or field1 is 'b' or field1 is 'c'"
      );
    });

    it('should handle negated phrases filter', () => {
      const filter = negate(getPhrasesFilter());
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(
        "field1 is not 'a' and field1 is not 'b' and field1 is not 'c'"
      );
    });

    it('should handle range filter', () => {
      const filter = getRangeFilter({ gte: 5, lt: 10 });
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(
        'range_field >= 5 and range_field < 10'
      );
    });

    it('should handle negated range filter', () => {
      const filter = negate(getRangeFilter({ gte: 5, lt: 10 }));
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(
        'range_field < 5 or range_field >= 10'
      );
    });

    it('should handle exists filter', () => {
      const filter = getExistsFilter();
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe('field1 should exist');
    });

    it('should handle negated exists filter', () => {
      const filter = negate(getExistsFilter());
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe('field1 should not exist');
    });

    it('should remove .keyword suffix from field names', () => {
      const filter = getPhraseFilter('field1.keyword', 'test');
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe("field1 is 'test'");
    });

    it('should handle single quotes in values', () => {
      const filter = getPhraseFilter('field1', "test's");
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(`field1 is "test's"`);
    });

    it('should handle single and double quotes in values', () => {
      const filter = getPhraseFilter('field1', `"test's"`);
      expect(NaturalLanguageFilterUtils.toPredicate(filter)).toBe(`field1 is \`"test's"\``);
    });
  });

  describe('addFiltersToQuery', () => {
    it('should add multiple filters to a query', () => {
      const filters: Filter[] = [
        getPhraseFilter('field1', 'value1'),
        getPhraseFilter('field2', 'value2'),
      ];
      const query = 'Show me data';

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, filters);

      expect(result).toBe("Show me data, field1 is 'value1', field2 is 'value2'");
    });

    it('should return original query when filters array is empty', () => {
      const query = 'Show me data';
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, []);

      expect(result).toBe('Show me data');
    });

    it('should work with an empty query', () => {
      const filters: Filter[] = [getPhraseFilter('field1', 'value1')];
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('', filters);

      expect(result).toBe("field1 is 'value1'");
    });
  });

  describe('addFilterToQuery functionality', () => {
    it('should return predicate when query is empty', () => {
      const filter = getPhraseFilter('field1', 'value1');
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('', [filter]);

      expect(result).toBe("field1 is 'value1'");
    });

    it('should add filter to query with a comma', () => {
      const filter = getPhraseFilter('field1', 'value1');
      const query = 'Show me data';
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, [filter]);

      expect(result).toBe("Show me data, field1 is 'value1'");
    });

    it('should not add duplicate filter to query', () => {
      const filter = getPhraseFilter('field1', 'value1');
      const query = "Show me data, field1 is 'value1'";
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, [filter]);

      expect(result).toBe("Show me data, field1 is 'value1'");
    });

    it('should replace negated filter with positive filter', () => {
      const filter = getPhraseFilter('field1', 'value1');
      const query = "Show me data, field1 is not 'value1'";
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, [filter]);

      expect(result).toBe("Show me data, field1 is 'value1'");
    });

    it('should replace positive filter with negated filter', () => {
      const filter = negate(getPhraseFilter('field1', 'value1'));
      const query = "Show me data, field1 is 'value1'";
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, [filter]);

      expect(result).toBe("Show me data, field1 is not 'value1'");
    });

    it('should add multiple filters to a query in sequence', () => {
      const filters: Filter[] = [
        getPhraseFilter('field1', 'value1'),
        getPhraseFilter('field2', 'value2'),
        getPhraseFilter('field3', 'value3'),
      ];

      let result = 'Show me data';
      for (const filter of filters) {
        result = NaturalLanguageFilterUtils.addFiltersToPrompt(result, [filter]);
      }

      expect(result).toBe(
        "Show me data, field1 is 'value1', field2 is 'value2', field3 is 'value3'"
      );
    });

    it('should handle filters with no predicate', () => {
      const invalidFilter: Filter = {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          negate: false,
          type: 'custom',
        },
        query: {},
      };

      const query = 'Show me data';
      const result = NaturalLanguageFilterUtils.addFiltersToPrompt(query, [invalidFilter]);

      expect(result).toBe('Show me data');
    });

    it('should handle whitespace-only queries', () => {
      const filter = getPhraseFilter('field1', 'value1');

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('   ', [filter]);

      expect(result).toBe("field1 is 'value1'");
    });

    it('should ignore duplicates when multiple identical filters are added', () => {
      const filter1 = getPhraseFilter('field1', 'value1');
      const filter2 = { ...filter1 };

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('Show me data', [
        filter1,
        filter2,
      ]);

      expect(result).toBe("Show me data, field1 is 'value1'");
    });

    it('should handle numeric field values properly', () => {
      const filter = getPhraseFilter('amount', 100 as any);
      filter.query.match_phrase.amount = 100;

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('Show me data', [filter]);

      expect(result).toBe('Show me data, amount is 100');
    });

    it('should handle boolean field values', () => {
      const filter = getPhraseFilter('is_active', true as any);
      filter.query.match_phrase.is_active = true;

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('Show me data', [filter]);

      expect(result).toBe('Show me data, is_active is true');
    });

    it('should handle undefined field in filter', () => {
      const filter: Filter = {
        meta: {
          alias: null,
          disabled: false,
          index: 'mock-index',
          negate: false,
          type: 'custom',
        },
        query: {},
      };

      const result = NaturalLanguageFilterUtils.addFiltersToPrompt('Show me data', [filter]);

      expect(result).toBe('Show me data');
    });
  });
});
