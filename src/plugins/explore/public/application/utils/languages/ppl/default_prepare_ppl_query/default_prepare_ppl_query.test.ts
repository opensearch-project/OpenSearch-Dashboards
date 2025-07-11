/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { defaultPreparePplQuery } from './default_prepare_ppl_query';

describe('defaultPreparePplQuery', () => {
  it('should combine prependSourceIfNecessary and stripStatsFromQuery', () => {
    const query: Query = {
      query: 'level="error" | stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset level="error"',
    });
  });

  it('should handle query that already has source', () => {
    const query: Query = {
      query: 'source=existing-index | where level="error" | stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'source=existing-index | where level="error"',
    });
  });

  it('should handle empty query', () => {
    const query: Query = {
      query: '',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset',
    });
  });

  it('should handle query with only stats pipe', () => {
    const query: Query = {
      query: '| stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset',
    });
  });

  it('should handle query starting with pipe and stats', () => {
    const query: Query = {
      query: '| where level="error" | stats count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'source=test-dataset | where level="error"',
    });
  });

  it('should handle search source queries with stats', () => {
    const query: Query = {
      query: 'search source=logs-* | where @timestamp > now()-1d | stats count by level',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'search source=logs-* | where @timestamp > now()-1d',
    });
  });

  it('should preserve case in source queries when stripping stats', () => {
    const query: Query = {
      query: 'SOURCE=LOGS-* | WHERE level="ERROR" | STATS count by host',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = defaultPreparePplQuery(query);
    expect(result).toEqual({
      ...query,
      query: 'SOURCE=LOGS-* | WHERE level="ERROR"',
    });
  });
});
