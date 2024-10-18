/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createIndexName } from './create_index_name';

describe('createIndexName', () => {
  it('should return a name with the custom prefix when provided', () => {
    const result = createIndexName('sample1', 'data1', 'custom');
    expect(result).toBe('custom-data1');
  });

  it('should return the sample dataset name when sampleDataSetId equals dataIndexId', () => {
    const result = createIndexName('sample1', 'sample1');
    expect(result).toBe('opensearch_dashboards_sample_data_sample1');
  });

  it('should return a name with both sampleDataSetId and dataIndexId when they are different', () => {
    const result = createIndexName('sample1', 'data1');
    expect(result).toBe('opensearch_dashboards_sample_data_sample1_data1');
  });

  it('should prioritize customPrefix over other parameters when provided', () => {
    const result = createIndexName('sample1', 'data1', 'prefix');
    expect(result).toBe('prefix-data1');
  });
});
