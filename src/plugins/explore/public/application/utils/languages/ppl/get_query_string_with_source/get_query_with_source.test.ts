/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { getQueryWithSource } from './get_query_with_source';

describe('getQueryWithSource', () => {
  it('should handle undefined query by using empty string', () => {
    const query: Query = {
      query: undefined as any,
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset',
    });
  });

  it('should return original query when it starts with "source" (case sensitive)', () => {
    const query: Query = {
      query: 'source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "SOURCE" (case insensitive)', () => {
    const query: Query = {
      query: 'SOURCE=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "search source" (case sensitive)', () => {
    const query: Query = {
      query: 'search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "SEARCH SOURCE" (case insensitive)', () => {
    const query: Query = {
      query: 'SEARCH SOURCE=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle flexible whitespace between source and =', () => {
    const query: Query = {
      query: 'source   =existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle no whitespace between source and =', () => {
    const query: Query = {
      query: 'source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle flexible whitespace between search, source and =', () => {
    const query: Query = {
      query: 'search    source   =existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle single space between search and source with no space before =', () => {
    const query: Query = {
      query: 'search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should prepend source for empty query string', () => {
    const query: Query = {
      query: '',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset',
    });
  });

  it('should prepend source for whitespace-only query string', () => {
    const query: Query = {
      query: '   \t\n  ',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset',
    });
  });

  it('should prepend source without extra pipe when query starts with pipe', () => {
    const query: Query = {
      query: '| where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset | where level="error"',
    });
  });

  it('should handle query starting with pipe and whitespace', () => {
    const query: Query = {
      query: '  | where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset   | where level="error"',
    });
  });

  it('should handle leading whitespace before source', () => {
    const query: Query = {
      query: ' source = data_logs_small_time_1* | where unique_category = "Configuration"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle leading whitespace before search source', () => {
    const query: Query = {
      query: '  search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "describe"', () => {
    const query: Query = {
      query: 'describe table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "DESCRIBE" (case insensitive)', () => {
    const query: Query = {
      query: 'DESCRIBE table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should handle leading whitespace before describe', () => {
    const query: Query = {
      query: '  describe table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "show"', () => {
    const query: Query = {
      query: 'show tables',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "SHOW" (case insensitive)', () => {
    const query: Query = {
      query: 'SHOW TABLES',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = getQueryWithSource(query);
    expect(result).toEqual(query);
  });
});
