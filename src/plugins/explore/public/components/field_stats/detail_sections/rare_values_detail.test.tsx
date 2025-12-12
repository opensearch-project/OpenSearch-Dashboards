/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { rareValuesDetailConfig } from './rare_values_detail';
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

describe('RareValuesSection Component', () => {
  const RareValuesSection = rareValuesDetailConfig.component;
  const mockField = createMockFieldStatsItem({
    name: 'status',
    type: 'keyword',
    docCount: 1000,
  });

  it('renders rare values table with data', () => {
    const mockRareValues = [
      { value: 'timeout', count: 50 },
      { value: 'cancelled', count: 30 },
      { value: 'unknown', count: 20 },
    ];
    const component = mountWithIntl(<RareValuesSection data={mockRareValues} field={mockField} />);
    const table = component.find(EuiBasicTable);

    expect(component.find('[data-test-subj="rareValuesSection"]').length).toBeGreaterThanOrEqual(1);
    expect(table.prop('items')).toHaveLength(3);
    const items = table.prop('items') as any[];
    expect(items[0].percentage).toBe(5);
    expect(items[1].percentage).toBe(3);
    expect(items[2].percentage).toBe(2);
    component.unmount();
  });

  it('renders emdash for undefined count values', () => {
    const mockRareValues = [
      { value: 'timeout', count: undefined },
      { value: 'cancelled', count: 30 },
    ];
    const component = mountWithIntl(<RareValuesSection data={mockRareValues} field={mockField} />);
    const table = component.find(EuiBasicTable);

    expect(table.prop('items')).toHaveLength(2);
    const columns = table.prop('columns') as any[];
    const countColumn = columns.find((col) => col.field === 'count');
    expect(countColumn.render(undefined)).toBe('—');
    expect(countColumn.render(30)).toBe('30');
    component.unmount();
  });
});

describe('rareValuesDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-pattern-id', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has valid configuration', () => {
    expectValidDetailConfig(rareValuesDetailConfig, 'rareValues', 'Rare Values', [
      'string',
      'keyword',
      'number',
      'ip',
      'boolean',
    ]);
  });

  it('fetches and parses rare values correctly', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResultWithHits([
        { status: 'timeout', count: 50 },
        { status: 'cancelled', count: 30 },
        { status: 'unknown', count: 20 },
      ])
    );

    const result = await rareValuesDetailConfig.fetchData('status', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      'source = test-index | rare 10 `status`',
      'test-pattern-id',
      'INDEX_PATTERN'
    );
    expect(result).toEqual([
      { value: 'timeout', count: 50 },
      { value: 'cancelled', count: 30 },
      { value: 'unknown', count: 20 },
    ]);
  });

  it('handles empty and missing data', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(mockEmptyQueryResult());

    const result = await rareValuesDetailConfig.fetchData('status', mockDataset, mockServices);

    expect(result).toEqual([]);
  });
});
