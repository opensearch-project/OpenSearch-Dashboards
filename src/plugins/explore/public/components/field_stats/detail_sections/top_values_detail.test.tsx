/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { topValuesDetailConfig } from './top_values_detail';
import { executeFieldStatsQuery } from '../field_stats_queries';
import { TopValue } from '../utils/field_stats_types';
import {
  createMockFieldStatsItem,
  createMockDataset,
  createMockServices,
} from '../utils/field_stats.stubs';
import { EuiBasicTable } from '@elastic/eui';

jest.mock('../field_stats_queries', () => ({
  executeFieldStatsQuery: jest.fn(),
}));

const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('TopValuesSection Component', () => {
  const TopValuesSection = topValuesDetailConfig.component;
  let component: ReactWrapper;

  const mockField = createMockFieldStatsItem({
    name: 'status',
    type: 'keyword',
    docCount: 1000,
    distinctCount: 5,
    docPercentage: 100,
  });

  const mockTopValues: TopValue[] = [
    { value: 'success', count: 500 },
    { value: 'error', count: 300 },
    { value: 'pending', count: 200 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    expect(component.exists()).toBe(true);
  });

  it('renders EuiBasicTable with correct test subject', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    expect(component.find('[data-test-subj="topValuesSection"]').length).toBeGreaterThanOrEqual(1);
  });

  it('displays correct number of rows', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);
    expect(table.prop('items')).toHaveLength(3);
  });

  it('calculates percentages correctly', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);
    const items = table.prop('items') as any[];

    expect(items[0].percentage).toBe(50);
    expect(items[1].percentage).toBe(30);
    expect(items[2].percentage).toBe(20);
  });

  it('handles zero docCount without errors', () => {
    const fieldWithZeroCount = { ...mockField, docCount: 0 };
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={fieldWithZeroCount} />);
    const table = component.find(EuiBasicTable);
    const items = table.prop('items') as any[];

    expect(items[0].percentage).toBe(0);
    expect(items[1].percentage).toBe(0);
    expect(items[2].percentage).toBe(0);
  });

  it('renders three columns', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);
    const columns = table.prop('columns') as any[];

    expect(columns).toHaveLength(3);
    expect(columns[0].field).toBe('value');
    expect(columns[1].field).toBe('count');
    expect(columns[2].field).toBe('percentage');
  });

  it('formats count with locale string', () => {
    const largeCountData: TopValue[] = [{ value: 'test', count: 1000000 }];
    component = mountWithIntl(<TopValuesSection data={largeCountData} field={mockField} />);
    const table = component.find(EuiBasicTable);
    const columns = table.prop('columns') as any[];
    const countColumn = columns[1];

    expect(countColumn.render(1000000)).toBe('1,000,000');
  });

  it('formats percentage with one decimal place', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);
    const columns = table.prop('columns') as any[];
    const percentageColumn = columns[2];

    expect(percentageColumn.render(50.567)).toBe('50.6%');
    expect(percentageColumn.render(30.123)).toBe('30.1%');
  });

  it('converts value to string in render', () => {
    component = mountWithIntl(<TopValuesSection data={mockTopValues} field={mockField} />);
    const table = component.find(EuiBasicTable);
    const columns = table.prop('columns') as any[];
    const valueColumn = columns[0];

    expect(valueColumn.render('test')).toBe('test');
    expect(valueColumn.render(123)).toBe('123');
  });

  it('handles empty data array', () => {
    component = mountWithIntl(<TopValuesSection data={[]} field={mockField} />);
    const table = component.find(EuiBasicTable);
    expect(table.prop('items')).toHaveLength(0);
  });
});

describe('topValuesDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-pattern-id', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct configuration properties', () => {
    expect(topValuesDetailConfig.id).toBe('topValues');
    expect(topValuesDetailConfig.title).toBeDefined();
    expect(topValuesDetailConfig.applicableToTypes).toEqual([
      'string',
      'keyword',
      'number',
      'ip',
      'boolean',
    ]);
  });

  describe('fetchData', () => {
    it('generates correct PPL query', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        'source = test-index | top 10 `status`',
        'test-pattern-id',
        'INDEX_PATTERN'
      );
    });

    it('parses query results correctly', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            { _source: { status: 'success', count: 500 } },
            { _source: { status: 'error', count: 300 } },
            { _source: { status: 'pending', count: 200 } },
          ],
        },
      });

      const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(result).toEqual([
        { value: 'success', count: 500 },
        { value: 'error', count: 300 },
        { value: 'pending', count: 200 },
      ]);
    });

    it('handles empty results', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(result).toEqual([]);
    });

    it('handles missing hits structure', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({});

      const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(result).toEqual([]);
    });

    it('handles missing _source in hits', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [{ _id: '1' }, { _id: '2' }],
        },
      });

      const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(result).toEqual([
        { value: undefined, count: 0 },
        { value: undefined, count: 0 },
      ]);
    });

    it('handles missing count field', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [{ _source: { status: 'success' } }],
        },
      });

      const result = await topValuesDetailConfig.fetchData('status', mockDataset, mockServices);

      expect(result).toEqual([{ value: 'success', count: 0 }]);
    });

    it('uses default dataset type when id is not provided', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      const datasetWithoutId = { ...mockDataset, id: undefined };
      await topValuesDetailConfig.fetchData('status', datasetWithoutId, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        'source = test-index | top 10 `status`',
        '',
        'INDEX_PATTERN'
      );
    });

    it('passes correct dataset type to query executor', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      const customDataset = { ...mockDataset, type: 'CUSTOM_TYPE' };
      await topValuesDetailConfig.fetchData('status', customDataset, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        expect.any(String),
        'test-pattern-id',
        'CUSTOM_TYPE'
      );
    });
  });
});
