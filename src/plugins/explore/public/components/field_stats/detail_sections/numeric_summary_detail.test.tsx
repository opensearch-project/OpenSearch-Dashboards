/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { numericSummaryDetailConfig } from './numeric_summary_detail';
import { executeFieldStatsQuery } from '../field_stats_queries';
import {
  createMockFieldStatsItem,
  createMockDataset,
  createMockServices,
  mockQueryResult,
  mockEmptyQueryResult,
  expectValidDetailConfig,
} from '../utils/field_stats.stubs';

jest.mock('../field_stats_queries');

const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('NumericSummarySection', () => {
  const NumericSummaryComponent = numericSummaryDetailConfig.component;
  const mockField = createMockFieldStatsItem({ name: 'bytes', type: 'number' });

  it('renders numeric summary with all values', () => {
    const mockData = { min: 0, median: 50, avg: 55.5, max: 100 };
    const component = mountWithIntl(<NumericSummaryComponent data={mockData} field={mockField} />);

    expect(component.find('[data-test-subj="numericSummarySection"]').length).toBeGreaterThan(0);
    const text = component.text();
    expect(text).toContain('Min');
    expect(text).toContain('0');
    expect(text).toContain('Median');
    expect(text).toContain('50');
    expect(text).toContain('Average');
    expect(text).toContain('55.5');
    expect(text).toContain('Max');
    expect(text).toContain('100');
    component.unmount();
  });
});

describe('numericSummaryDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-index-pattern', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has valid configuration', () => {
    expectValidDetailConfig(numericSummaryDetailConfig, 'numericSummary', 'Summary Statistics', [
      'number',
    ]);
  });

  it('fetches and parses numeric summary data correctly', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResult({ min: 10, median: 50, avg: 55, max: 100 })
    );

    const result = await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      expect.stringContaining('source = test-index'),
      'test-index-pattern',
      'INDEX_PATTERN'
    );
    const query = mockExecuteFieldStatsQuery.mock.calls[0][1];
    expect(query).toContain('stats min(`bytes`) as min');
    expect(query).toContain('percentile(`bytes`, 50) as median');
    expect(query).toContain('avg(`bytes`) as avg');
    expect(query).toContain('max(`bytes`) as max');
    expect(result).toEqual({ min: 10, median: 50, avg: 55, max: 100 });
  });

  it('handles empty results with default values', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(mockEmptyQueryResult());

    const result = await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    expect(result).toEqual({ min: 0, median: 0, avg: 0, max: 0 });
  });
});
