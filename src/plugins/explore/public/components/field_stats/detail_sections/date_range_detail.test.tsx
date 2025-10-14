/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { findTestSubject } from 'test_utils/helpers';
import { dateRangeDetailConfig } from './date_range_detail';
import { DateRange } from '../utils/field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';
import {
  createMockFieldStatsItem,
  createMockDataset,
  createMockServices,
} from '../utils/field_stats.stubs';

jest.mock('../field_stats_queries', () => ({
  executeFieldStatsQuery: jest.fn(),
}));

const mockExecuteFieldStatsQuery = executeFieldStatsQuery as jest.MockedFunction<
  typeof executeFieldStatsQuery
>;

describe('DateRangeSection', () => {
  const DateRangeSection = dateRangeDetailConfig.component;
  let component: ReactWrapper;

  const mockField = createMockFieldStatsItem({
    name: 'timestamp',
    type: 'date',
    docPercentage: 100,
  });

  afterEach(() => {
    component?.unmount();
  });

  it('renders date range with both earliest and latest dates', () => {
    const dateRange: DateRange = {
      earliest: '2025-01-01T10:00:00.000Z',
      latest: '2025-01-31T23:59:59.999Z',
    };

    component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');
    expect(section.length).toBe(1);

    const text = section.text();
    expect(text).toContain('Earliest');
    expect(text).toContain('Latest');
    expect(text).toContain('Jan 1, 2025');
    expect(text).toContain('Jan 31, 2025');
  });

  it('renders dash when earliest date is null', () => {
    const dateRange: DateRange = {
      earliest: null,
      latest: '2025-01-31T23:59:59.999Z',
    };

    component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');
    const text = section.text();

    expect(text).toContain('Earliest');
    expect(text).toContain('—');
    expect(text).toContain('Jan 31, 2025');
  });

  it('renders dash when latest date is null', () => {
    const dateRange: DateRange = {
      earliest: '2025-01-01T10:00:00.000Z',
      latest: null,
    };

    component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');
    const text = section.text();

    expect(text).toContain('Latest');
    expect(text).toContain('—');
    expect(text).toContain('Jan 1, 2025');
  });

  it('renders dashes when both dates are null', () => {
    const dateRange: DateRange = {
      earliest: null,
      latest: null,
    };

    component = mountWithIntl(<DateRangeSection data={dateRange} field={mockField} />);
    const section = findTestSubject(component, 'dateRangeSection');
    const text = section.text();

    expect(text).toContain('Earliest');
    expect(text).toContain('Latest');
    const dashes = text.match(/—/g);
    expect(dashes?.length).toBe(2);
  });
});

describe('dateRangeDetailConfig', () => {
  it('has correct configuration properties', () => {
    expect(dateRangeDetailConfig.id).toBe('dateRange');
    expect(dateRangeDetailConfig.title).toBe('Date Range');
    expect(dateRangeDetailConfig.applicableToTypes).toEqual(['date']);
    expect(dateRangeDetailConfig.fetchData).toBeDefined();
    expect(dateRangeDetailConfig.component).toBeDefined();
  });

  describe('fetchData', () => {
    const mockDataset = createMockDataset({ id: 'test-index-pattern', title: 'test-index' });
    const mockServices = createMockServices();

    beforeEach(() => {
      mockExecuteFieldStatsQuery.mockClear();
    });

    it('fetches date range data successfully', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {
                earliest: '2025-01-01T10:00:00.000Z',
                latest: '2025-01-31T23:59:59.999Z',
              },
            },
          ],
        },
      });

      const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

      expect(mockExecuteFieldStatsQuery).toHaveBeenCalledWith(
        mockServices,
        expect.stringContaining('source = test-index'),
        'test-index-pattern',
        'INDEX_PATTERN'
      );
      expect(result).toEqual({
        earliest: '2025-01-01T10:00:00.000Z',
        latest: '2025-01-31T23:59:59.999Z',
      });
    });

    it('handles empty results', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [],
        },
      });

      const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

      expect(result).toEqual({
        earliest: null,
        latest: null,
      });
    });

    it('handles missing earliest and latest values', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: {
          hits: [
            {
              _source: {},
            },
          ],
        },
      });

      const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

      expect(result).toEqual({
        earliest: null,
        latest: null,
      });
    });

    it('handles undefined hits', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({});

      const result = await dateRangeDetailConfig.fetchData('timestamp', mockDataset, mockServices);

      expect(result).toEqual({
        earliest: null,
        latest: null,
      });
    });

    it('generates correct PPL query', async () => {
      mockExecuteFieldStatsQuery.mockResolvedValue({
        hits: { hits: [] },
      });

      await dateRangeDetailConfig.fetchData('myDateField', mockDataset, mockServices);

      const callArgs = mockExecuteFieldStatsQuery.mock.calls[0];
      const query = callArgs[1];

      expect(query).toContain('source = test-index');
      expect(query).toContain('min(`myDateField`) as earliest');
      expect(query).toContain('max(`myDateField`) as latest');
    });
  });
});
