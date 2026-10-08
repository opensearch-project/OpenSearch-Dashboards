/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { addPPLSourceClause } from './get_query_with_source';

describe('addPPLSourceClause', () => {
  it('should handle undefined query by using empty string', () => {
    const query: Query = {
      query: undefined as any,
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source = `test-dataset`',
    });
  });

  it('should return original query when it starts with "source" (case sensitive)', () => {
    const query: Query = {
      query: 'source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source=`existing-index` | where field=value' });
  });

  it('should return original query when it starts with "SOURCE" (case insensitive)', () => {
    const query: Query = {
      query: 'SOURCE=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'SOURCE=`existing-index` | where field=value' });
  });

  it('should return original query when it starts with "search source" (case sensitive)', () => {
    const query: Query = {
      query: 'search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'search source=`existing-index` | where field=value',
    });
  });

  it('should return original query when it starts with "SEARCH SOURCE" (case insensitive)', () => {
    const query: Query = {
      query: 'SEARCH SOURCE=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'SEARCH SOURCE=`existing-index` | where field=value',
    });
  });

  it('should handle flexible whitespace between source and =', () => {
    const query: Query = {
      query: 'source   =existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source   =`existing-index` | where field=value' });
  });

  it('should handle no whitespace between source and =', () => {
    const query: Query = {
      query: 'source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source=`existing-index` | where field=value' });
  });

  it('should handle no whitespace between source and dataSource and pipe', () => {
    const query: Query = {
      query: 'source=existing-index|where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source=`existing-index`|where field=value' });
  });

  it('should handle flexible whitespace between search, source and =', () => {
    const query: Query = {
      query: 'search    source   =existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'search    source   =`existing-index` | where field=value',
    });
  });

  it('should handle single space between search and source with no space before =', () => {
    const query: Query = {
      query: 'search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'search source=`existing-index` | where field=value',
    });
  });

  it('should prepend source for empty query string', () => {
    const query: Query = {
      query: '',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source = `test-dataset`',
    });
  });

  it('should prepend source for whitespace-only query string', () => {
    const query: Query = {
      query: '   \t\n  ',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source = `test-dataset`',
    });
  });

  it('should prepend source without extra pipe when query starts with pipe', () => {
    const query: Query = {
      query: '| where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source = `test-dataset` | where level="error"',
    });
  });

  it('should handle query starting with pipe and whitespace', () => {
    const query: Query = {
      query: '  | where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source = `test-dataset`   | where level="error"',
    });
  });

  it('should handle leading whitespace before source', () => {
    const query: Query = {
      query: ' source = data_logs_small_time_1* | where unique_category = "Configuration"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: ' source = `data_logs_small_time_1*` | where unique_category = "Configuration"',
    });
  });

  it('should handle leading whitespace before search source', () => {
    const query: Query = {
      query: '  search source=existing-index | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: '  search source=`existing-index` | where field=value',
    });
  });

  it('should return original query when it starts with "describe"', () => {
    const query: Query = {
      query: 'describe table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "DESCRIBE" (case insensitive)', () => {
    const query: Query = {
      query: 'DESCRIBE table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle leading whitespace before describe', () => {
    const query: Query = {
      query: '  describe table_name',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "show"', () => {
    const query: Query = {
      query: 'show tables',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should return original query when it starts with "SHOW" (case insensitive)', () => {
    const query: Query = {
      query: 'SHOW TABLES',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle if we have a field Expression infront of SOURCE command', () => {
    const query: Query = {
      query: 'unique_category = "Configuration" source = `data_logs_small_time_1*`',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle comma-separated sources without spaces', () => {
    const query: Query = {
      query:
        'source=opensearch_dashboards_sample_data_ecommerce,opensearch_dashboards_sample_data_flights',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query:
        'source=`opensearch_dashboards_sample_data_ecommerce,opensearch_dashboards_sample_data_flights`',
    });
  });

  it('should handle comma-separated sources with a space after comma', () => {
    const query: Query = {
      query:
        'source=opensearch_dashboards_sample_data_ecommerce, opensearch_dashboards_sample_data_flights',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query:
        'source=`opensearch_dashboards_sample_data_ecommerce,opensearch_dashboards_sample_data_flights`',
    });
  });

  it('should handle comma-separated sources with spaces and a pipe', () => {
    const query: Query = {
      query:
        'source=opensearch_dashboards_sample_data_ecommerce, opensearch_dashboards_sample_data_flights | where status=200',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query:
        'source=`opensearch_dashboards_sample_data_ecommerce,opensearch_dashboards_sample_data_flights` | where status=200',
    });
  });

  it('should handle multiple comma-separated sources with spaces', () => {
    const query: Query = {
      query: 'source=index1, index2, index3',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`index1,index2,index3`',
    });
  });

  it('should handle trailing comma by including it inside backticks', () => {
    const query: Query = {
      query: 'source=index1,',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`index1,`',
    });
  });

  it('should handle trailing comma with multiple sources', () => {
    const query: Query = {
      query: 'source=index1,index2,',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`index1,index2,`',
    });
  });

  it('should not mangle source= in a field comparison after a pipe', () => {
    const query: Query = {
      query: 'source=index1 | where source=prod',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`index1` | where source=prod',
    });
  });

  it('should not mangle source= in a field comparison after a pipe with spaces', () => {
    const query: Query = {
      query: 'source=my-index | where source = "production" | stats count()',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`my-index` | where source = "production" | stats count()',
    });
  });

  it('should leave already backtick-quoted source name as-is', () => {
    const query: Query = {
      query: 'source=`my-index-v3` | where field=value',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle wildcard source patterns', () => {
    const query: Query = {
      query: 'source=logs-* | where level="error"',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`logs-*` | where level="error"',
    });
  });

  it('should handle source with dots (data streams)', () => {
    const query: Query = {
      query: 'source=.opensearch-observability | stats count()',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`.opensearch-observability` | stats count()',
    });
  });

  it('should handle source with hyphens and date patterns', () => {
    const query: Query = {
      query: 'source=my-index-2024.01.01',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`my-index-2024.01.01`',
    });
  });

  it('should handle multiple pipes with source references in filters', () => {
    const query: Query = {
      query: 'source=index1 | where source=x | stats count() by source',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`index1` | where source=x | stats count() by source',
    });
  });

  it('should handle search source with source in filter after pipe', () => {
    const query: Query = {
      query: 'search source=my-index | where source=env',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'search source=`my-index` | where source=env',
    });
  });

  it('should handle already backtick-quoted source with source in filter', () => {
    const query: Query = {
      query: 'source=`my-index` | where source=prod',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle wildcard comma-separated sources', () => {
    const query: Query = {
      query: 'source=logs-*, metrics-*',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({
      ...query,
      query: 'source=`logs-*,metrics-*`',
    });
  });

  it('should handle mixed unquoted and backtick-quoted comma-separated sources', () => {
    const query: Query = {
      query: 'source=index1,`index2`',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual(query);
  });

  it('should handle source= with nothing after it gracefully', () => {
    const query: Query = {
      query: 'source=',
      dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source=' });
  });

  it('should not apply backticks for non-INDEX_PATTERN dataset types', () => {
    const query: Query = {
      query: 'source=my-index | where source=prod',
      dataset: { title: 'test-dataset', id: '123', type: 'S3' },
      language: 'ppl',
    };
    const result = addPPLSourceClause(query);
    expect(result).toEqual({ ...query, query: 'source=my-index | where source=prod' });
  });
});
