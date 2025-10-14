/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { numericSummaryDetailConfig } from './numeric_summary_detail';
import { FieldStatsItem, NumericSummary, Dataset } from '../utils/field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';
import { ExploreServices } from '../../../types';

jest.mock('../field_stats_queries');

const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('NumericSummarySection', () => {
  const mockField: FieldStatsItem = {
    name: 'bytes',
    type: 'number',
    docCount: 100,
    distinctCount: 50,
    docPercentage: 100,
  };

  const mockNumericData: NumericSummary = {
    min: 0,
    median: 50,
    avg: 55.5,
    max: 100,
  };

  let component: ReactWrapper;
  const NumericSummaryComponent = numericSummaryDetailConfig.component;

  it('renders numeric summary with all values', () => {
    component = mountWithIntl(<NumericSummaryComponent data={mockNumericData} field={mockField} />);
    expect(component.find('[data-test-subj="numericSummarySection"]').length).toBeGreaterThan(0);
  });

  it('displays min value correctly', () => {
    component = mountWithIntl(<NumericSummaryComponent data={mockNumericData} field={mockField} />);
    const text = component.text();
    expect(text).toContain('Min');
    expect(text).toContain('0');
  });

  it('displays median value correctly', () => {
    component = mountWithIntl(<NumericSummaryComponent data={mockNumericData} field={mockField} />);
    const text = component.text();
    expect(text).toContain('Median');
    expect(text).toContain('50');
  });

  it('displays average value correctly', () => {
    component = mountWithIntl(<NumericSummaryComponent data={mockNumericData} field={mockField} />);
    const text = component.text();
    expect(text).toContain('Average');
    expect(text).toContain('55.5');
  });

  it('displays max value correctly', () => {
    component = mountWithIntl(<NumericSummaryComponent data={mockNumericData} field={mockField} />);
    const text = component.text();
    expect(text).toContain('Max');
    expect(text).toContain('100');
  });

  it('displays formatted numbers with toLocaleString', () => {
    const largeData: NumericSummary = {
      min: 1000,
      median: 5000,
      avg: 5500.5,
      max: 10000,
    };
    component = mountWithIntl(<NumericSummaryComponent data={largeData} field={mockField} />);
    const text = component.text();
    expect(text).toContain('1,000');
    expect(text).toContain('5,000');
    expect(text).toContain('5,500.5');
    expect(text).toContain('10,000');
  });

  it('displays em dash for null values', () => {
    const dataWithNulls: NumericSummary = {
      min: 0,
      median: null as any,
      avg: null as any,
      max: 0,
    };
    component = mountWithIntl(<NumericSummaryComponent data={dataWithNulls} field={mockField} />);
    const text = component.text();
    expect(text).toContain('—');
  });

  it('displays em dash for undefined values', () => {
    const dataWithUndefined: NumericSummary = {
      min: undefined as any,
      median: undefined as any,
      avg: undefined as any,
      max: undefined as any,
    };
    component = mountWithIntl(
      <NumericSummaryComponent data={dataWithUndefined} field={mockField} />
    );
    const text = component.text();
    const dashCount = (text.match(/—/g) || []).length;
    expect(dashCount).toBeGreaterThanOrEqual(4);
  });
});

describe('numericSummaryDetailConfig', () => {
  const mockDataset: Dataset = {
    id: 'test-index-pattern',
    type: 'INDEX_PATTERN',
    title: 'test-index',
  };

  const mockServices = {
    data: {
      search: {},
      dataViews: {},
      query: {},
    },
  } as ExploreServices;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct configuration properties', () => {
    expect(numericSummaryDetailConfig.id).toBe('numericSummary');
    expect(numericSummaryDetailConfig.title).toBeDefined();
    expect(numericSummaryDetailConfig.applicableToTypes).toEqual(['number']);
    expect(numericSummaryDetailConfig.component).toBeDefined();
    expect(numericSummaryDetailConfig.fetchData).toBeDefined();
  });

  it('fetchData returns numeric summary data from query results', async () => {
    const mockQueryResult = {
      hits: {
        hits: [
          {
            _source: {
              min: 10,
              median: 50,
              avg: 55,
              max: 100,
            },
          },
        ],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    const result = await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      expect.stringContaining('source = test-index'),
      'test-index-pattern',
      'INDEX_PATTERN'
    );
    expect(result).toEqual({
      min: 10,
      median: 50,
      avg: 55,
      max: 100,
    });
  });

  it('fetchData generates correct PPL query', async () => {
    const mockQueryResult = {
      hits: {
        hits: [
          {
            _source: {
              min: 0,
              median: 0,
              avg: 0,
              max: 0,
            },
          },
        ],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    const callArgs = mockExecuteFieldStatsQuery.mock.calls[0];
    const query = callArgs[1];

    expect(query).toContain('source = test-index');
    expect(query).toContain('stats min(`bytes`) as min');
    expect(query).toContain('percentile(`bytes`, 50) as median');
    expect(query).toContain('avg(`bytes`) as avg');
    expect(query).toContain('max(`bytes`) as max');
  });

  it('fetchData returns default values when result is empty', async () => {
    const mockQueryResult = {
      hits: {
        hits: [],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    const result = await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    expect(result).toEqual({
      min: 0,
      median: 0,
      avg: 0,
      max: 0,
    });
  });

  it('fetchData returns default values when stats are missing', async () => {
    const mockQueryResult = {
      hits: {
        hits: [
          {
            _source: {},
          },
        ],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    const result = await numericSummaryDetailConfig.fetchData('bytes', mockDataset, mockServices);

    expect(result).toEqual({
      min: 0,
      median: 0,
      avg: 0,
      max: 0,
    });
  });

  it('fetchData handles fields with special characters in names', async () => {
    const mockQueryResult = {
      hits: {
        hits: [
          {
            _source: {
              min: 5,
              median: 10,
              avg: 12,
              max: 20,
            },
          },
        ],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    await numericSummaryDetailConfig.fetchData('field.with.dots', mockDataset, mockServices);

    const callArgs = mockExecuteFieldStatsQuery.mock.calls[0];
    const query = callArgs[1];

    expect(query).toContain('`field.with.dots`');
  });

  it('fetchData passes correct dataset type to query executor', async () => {
    const mockQueryResult = {
      hits: {
        hits: [{ _source: { min: 0, median: 0, avg: 0, max: 0 } }],
      },
    };

    mockExecuteFieldStatsQuery.mockResolvedValue(mockQueryResult);

    const customDataset: Dataset = {
      id: 'custom-id',
      type: 'CUSTOM_TYPE',
      title: 'custom-index',
    };

    await numericSummaryDetailConfig.fetchData('bytes', customDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      expect.any(String),
      'custom-id',
      'CUSTOM_TYPE'
    );
  });
});
