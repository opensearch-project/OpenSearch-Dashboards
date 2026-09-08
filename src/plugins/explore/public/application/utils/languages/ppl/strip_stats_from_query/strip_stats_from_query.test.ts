/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { stripStatsFromQuery } from './strip_stats_from_query';

describe('stripStatsFromQuery', () => {
  it('should remove stats pipe from query string', () => {
    const queryWithStats: Query = {
      query: 'source=logs | where level="error" | stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs | where level="error"',
    });
  });

  it('should handle query without stats pipe', () => {
    const queryWithoutStats: Query = {
      query: 'source=logs | where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithoutStats);
    expect(result).toEqual({
      ...queryWithoutStats,
      query: 'source=logs | where level="error"',
    });
  });

  it('should handle empty query string', () => {
    const emptyQuery: Query = {
      query: '',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(emptyQuery);
    expect(result).toEqual({
      ...emptyQuery,
      query: '',
    });
  });

  it('should handle case insensitive stats removal', () => {
    const queryWithStats: Query = {
      query: 'source=logs | STATS count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs',
    });
  });

  it('should handle stats with extra whitespace', () => {
    const queryWithStats: Query = {
      query: 'source=logs   |   stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs',
    });
  });

  it('should handle undefined query by using empty string', () => {
    const queryWithUndefined: Query = {
      query: undefined as any,
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithUndefined);
    expect(result).toEqual({
      ...queryWithUndefined,
      query: '',
    });
  });

  it('should preserve other query properties', () => {
    const queryWithStats: Query = {
      query: 'source=logs | stats count by host',
      dataset: { title: 'my-dataset', id: 'abc123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      query: 'source=logs',
      dataset: { title: 'my-dataset', id: 'abc123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    });
  });

  it('should remove stats pipe in multi-line query where stats is on a separate line', () => {
    const queryWithStats: Query = {
      query: 'source=logs\n| where level="error"\n| stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs\n| where level="error"',
    });
  });

  it('should remove stats and all subsequent pipes in multi-line query', () => {
    const queryWithStats: Query = {
      query: 'source=logs\n| where level="error"\n| stats count by host\n| sort -count',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs\n| where level="error"',
    });
  });

  it('should remove stats on last line when preceded by multi-line pipes', () => {
    const queryWithStats: Query = {
      query: 'source=logs\n| where level="error"\n| eval x=1\n| stats count by x',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStats);
    expect(result).toEqual({
      ...queryWithStats,
      query: 'source=logs\n| where level="error"\n| eval x=1',
    });
  });

  it('should remove top pipe (and everything after it)', () => {
    const queryWithTop: Query = {
      query: 'source=logs | where level="error" | top 10 host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithTop);
    expect(result).toEqual({
      ...queryWithTop,
      query: 'source=logs | where level="error"',
    });
  });

  it('should remove rare pipe (and everything after it)', () => {
    const queryWithRare: Query = {
      query: 'source=logs | rare 5 host | sort host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithRare);
    expect(result).toEqual({
      ...queryWithRare,
      query: 'source=logs',
    });
  });

  it('should not strip a field or command that merely starts with an aggregation name', () => {
    const queryWithTopicField: Query = {
      query: 'source=logs | where topic="checkout"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithTopicField);
    expect(result).toEqual({
      ...queryWithTopicField,
      query: 'source=logs | where topic="checkout"',
    });
  });

  it('should not strip a pipe command that appears inside a double-quoted string literal', () => {
    const queryWithStatsInString: Query = {
      query: 'source=logs | where msg="error | stats count()"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStatsInString);
    expect(result).toEqual({
      ...queryWithStatsInString,
      query: 'source=logs | where msg="error | stats count()"',
    });
  });

  it('should not strip a pipe command that appears inside a single-quoted string literal', () => {
    const queryWithTopInString: Query = {
      query: "source=logs | where msg='| top 5 host'",
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithTopInString);
    expect(result).toEqual({
      ...queryWithTopInString,
      query: "source=logs | where msg='| top 5 host'",
    });
  });

  it('should not strip an aggregation command nested inside a bracketed subquery', () => {
    const queryWithStatsInSubquery: Query = {
      query: 'source=logs | where user in [ source=admins | stats count by role ]',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithStatsInSubquery);
    expect(result).toEqual({
      ...queryWithStatsInSubquery,
      query: 'source=logs | where user in [ source=admins | stats count by role ]',
    });
  });

  it('should strip the top-level aggregation but keep an earlier subquery that contains one', () => {
    const queryWithSubqueryThenStats: Query = {
      query: 'source=logs | where user in [ source=admins | top 5 role ] | stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'PPL',
    };
    const result = stripStatsFromQuery(queryWithSubqueryThenStats);
    expect(result).toEqual({
      ...queryWithSubqueryThenStats,
      query: 'source=logs | where user in [ source=admins | top 5 role ]',
    });
  });
});
