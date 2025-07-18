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
});
