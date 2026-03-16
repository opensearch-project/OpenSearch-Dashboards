/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { findTestSubject } from 'test_utils/helpers';
import { examplesDetailConfig } from './examples_detail';
import * as fieldStatsQueries from '../field_stats_queries';
import {
  createMockFieldStatsItem,
  createMockDataset,
  createMockServices,
  mockQueryResultWithHits,
  mockEmptyQueryResult,
  expectValidDetailConfig,
} from '../utils/field_stats.stubs';

jest.mock('../field_stats_queries');

const mockExecuteFieldStatsQuery = fieldStatsQueries.executeFieldStatsQuery as jest.MockedFunction<
  typeof fieldStatsQueries.executeFieldStatsQuery
>;

describe('ExamplesSection', () => {
  const ExamplesSection = examplesDetailConfig.component;
  const mockField = createMockFieldStatsItem({ name: 'testField', type: 'object' });

  it('renders examples table with data', () => {
    const mockData = [{ value: 'test1' }, { value: 'test2' }, { value: { nested: 'object' } }];
    const component = mountWithIntl(<ExamplesSection data={mockData} field={mockField} />);

    expect(findTestSubject(component, 'examplesSection').length).toBe(1);
    expect(component.text()).toContain('test1');
    expect(component.text()).toContain('test2');
    component.unmount();
  });
});

describe('examplesDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-dataset-id', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has valid configuration', () => {
    expectValidDetailConfig(examplesDetailConfig, 'examples', 'Examples', [
      'geo_point',
      'geo_shape',
      'binary',
      'object',
    ]);
  });

  it('fetches and parses example values correctly', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResultWithHits([
        { testField: 'value1' },
        { testField: 'value2' },
        { testField: { nested: 'value' } },
      ])
    );

    const result = await examplesDetailConfig.fetchData('testField', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      expect.stringContaining('source = test-index'),
      'test-dataset-id',
      'INDEX_PATTERN'
    );
    expect(result).toEqual([
      { value: 'value1' },
      { value: 'value2' },
      { value: { nested: 'value' } },
    ]);
  });

  it('handles empty and null values', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResultWithHits([
        { testField: 'value1' },
        { testField: null },
        { testField: 'value2' },
        {},
      ])
    );

    const result = await examplesDetailConfig.fetchData('testField', mockDataset, mockServices);

    expect(result).toEqual([{ value: 'value1' }, { value: 'value2' }]);
  });

  it('handles empty query results', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(mockEmptyQueryResult());

    const result = await examplesDetailConfig.fetchData('testField', mockDataset, mockServices);

    expect(result).toEqual([]);
  });
});
