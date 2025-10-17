/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { findTestSubject } from 'test_utils/helpers';
import { dateRangeDetailConfig } from './date_range_detail';
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

describe('DateRangeSection', () => {
  const DateRangeSection = dateRangeDetailConfig.component;
  const mockField = createMockFieldStatsItem({ name: 'timestamp', type: 'date' });

  it('renders date range with dates', () => {
    const dateRange = {
      earliest: '2025-01-01T10:00:00.000Z',
      latest: '2025-01-31T23:59:59.999Z',
    };
    const component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');

    expect(section.length).toBe(1);
    const text = section.text();
    expect(text).toContain('Earliest');
    expect(text).toContain('Latest');
    expect(text).toContain('Jan 1, 2025');
    expect(text).toContain('Jan 31, 2025');
    component.unmount();
  });

  it('renders dashes for null dates', () => {
    const dateRange = { earliest: null, latest: null };
    const component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');
    const text = section.text();

    expect(text).toContain('Earliest');
    expect(text).toContain('Latest');
    const dashes = text.match(/—/g);
    expect(dashes?.length).toBe(2);
    component.unmount();
  });
});

describe('dateRangeDetailConfig', () => {
  const mockDataset = createMockDataset({ id: 'test-index-pattern', title: 'test-index' });
  const mockServices = createMockServices();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has valid configuration', () => {
    expectValidDetailConfig(dateRangeDetailConfig, 'dateRange', 'Date Range', ['date']);
  });

  it('fetches and parses date range correctly', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(
      mockQueryResult({
        earliest: '2025-01-01T10:00:00.000Z',
        latest: '2025-01-31T23:59:59.999Z',
      })
    );

    const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

    expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
      mockServices,
      expect.stringContaining('source = test-index'),
      'test-index-pattern',
      'INDEX_PATTERN'
    );
    const query = mockExecuteFieldStatsQuery.mock.calls[0][1];
    expect(query).toContain('min(`timestamp`) as earliest');
    expect(query).toContain('max(`timestamp`) as latest');
    expect(result).toEqual({
      earliest: '2025-01-01T10:00:00.000Z',
      latest: '2025-01-31T23:59:59.999Z',
    });
  });

  it('handles empty results', async () => {
    mockExecuteFieldStatsQuery.mockResolvedValue(mockEmptyQueryResult());

    const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

    expect(result).toEqual({ earliest: null, latest: null });
  });
});
