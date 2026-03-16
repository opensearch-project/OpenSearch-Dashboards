/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { topValuesDetailConfig } from './top_values_detail';
import { executeFieldStatsQuery } from '../field_stats_queries';
import {
  createMockFieldStatsItem,
  createMockDataset,
  createMockServices,
  mockQueryResultWithHits,
  mockEmptyQueryResult,
  expectValidDetailConfig,
} from '../utils/field_stats.stubs';
import { EuiBasicTable } from '@elastic/eui';

jest.mock('../field_stats_queries');

const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('TopValuesSection Component', () => {
  const TopValuesSection = topValuesDetailConfig.component;
  const mockField = createMockFieldStatsItem({
    name: 'status',
    type: 'keyword',
    docCount: 1000,
  });

  it('renders top values table with data', () => {
    const mockTopValues = [
      { value: 'success', count: 500 },
      { value: 'error', count: 300 },
      { value: 'pending', count: 200 },
    ];
    const component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);

    expect(component.find('[data-test-subj="topValuesSection"]').length).toBeGreaterThanOrEqual(1);
    expect(table.prop('items')).toHaveLength(3);
    const items = table.prop('items') as any[];
    expect(items[0].percentage).toBe(50);
    expect(items[1].percentage).toBe(30);
    expect(items[2].percentage).toBe(20);
    component.unmount();
  });

  it('renders emdash for undefined count values', () => {
    const mockTopValues = [
      { value: 'success', count: undefined },
      { value: 'error', count: 300 },
    ];
    const component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);

    expect(table.prop('items')).toHaveLength(2);
    const columns = table.prop('columns') as any[];
    const countColumn = columns.find((col) => col.field === 'count');
    expect(countColumn.render(undefined)).toBe('—');
    expect(countColumn.render(300)).toBe('300');
    component.unmount();
  });
});

describe('topValuesDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-pattern-id', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has valid configuration', () => {
    expectValidDetailConfig(topValuesDetailConfig, 'topValues', 'Top Values', [
      'string',
      'keyword',
      'number',
      'ip',
      'boolean',
    ]);
  });

  it('fetches and parses top values correctly', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResultWithHits([
        { status: 'success', count: 500 },
        { status: 'error', count: 300 },
        { status: 'pending', count: 200 },
      ])
    );

    const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      'source = test-index | top 10 `status`',
      'test-pattern-id',
      'INDEX_PATTERN'
    );
    expect(result).toEqual([
      { value: 'success', count: 500 },
      { value: 'error', count: 300 },
      { value: 'pending', count: 200 },
    ]);
  });

  it('handles empty and missing data', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(mockEmptyQueryResult());

    const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

    expect(result).toEqual([]);
  });
});
