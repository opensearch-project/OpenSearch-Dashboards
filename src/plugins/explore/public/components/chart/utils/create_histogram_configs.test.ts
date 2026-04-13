/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHistogramConfigs } from './create_histogram_configs';
import { DataPublicPluginStart, DataView as Dataset } from '../../../../../data/public';

describe('createHistogramConfigs', () => {
  const mockDataset = {
    timeFieldName: '@timestamp',
  } as Dataset;

  const mockData = ({
    query: {
      timefilter: {
        timefilter: {
          getTime: jest.fn(() => ({
            from: 'now-15m',
            to: 'now',
          })),
        },
      },
    },
    search: {
      aggs: {
        createAggConfigs: jest.fn(),
      },
      showError: jest.fn(),
    },
  } as unknown) as DataPublicPluginStart;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create histogram configs successfully', () => {
    const mockAggConfigs = { id: 'test-agg-config' };
    (mockData.search.aggs.createAggConfigs as jest.Mock).mockReturnValue(mockAggConfigs);

    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const result = createHistogramConfigs(mockDataset, '1h', mockData);

    expect(mockData.search.aggs.createAggConfigs).toHaveBeenCalledWith(mockDataset, [
      {
        type: 'count',
        schema: 'metric',
      },
      {
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: '@timestamp',
          interval: '1h',
          timeRange: {
            from: 'now-15m',
            to: 'now',
          },
        },
      },
    ]);

    expect(result).toBe(mockAggConfigs);
  });

  it('should handle errors and show error message', () => {
    const error = new Error('Test error');
    (mockData.search.aggs.createAggConfigs as jest.Mock).mockImplementation(() => {
      throw error;
    });

    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const result = createHistogramConfigs(mockDataset, '1h', mockData);

    expect(mockData.search.showError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });

  it('should use the correct time field from dataset', () => {
    const datasetWithCustomTimeField = {
      timeFieldName: 'custom_timestamp',
    } as Dataset;

    // @ts-expect-error TS2554 TODO(ts-error): fixme
    createHistogramConfigs(datasetWithCustomTimeField, '30m', mockData);

    expect(mockData.search.aggs.createAggConfigs).toHaveBeenCalledWith(
      datasetWithCustomTimeField,
      expect.arrayContaining([
        expect.objectContaining({
          params: expect.objectContaining({
            field: 'custom_timestamp',
            interval: '30m',
          }),
        }),
      ])
    );
  });

  it('should get time range from timefilter', () => {
    const customTimeRange = { from: 'now-1d', to: 'now' };
    (mockData.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue(customTimeRange);

    // @ts-expect-error TS2554 TODO(ts-error): fixme
    createHistogramConfigs(mockDataset, '1h', mockData);

    expect(mockData.query.timefilter.timefilter.getTime).toHaveBeenCalled();
    expect(mockData.search.aggs.createAggConfigs).toHaveBeenCalledWith(
      mockDataset,
      expect.arrayContaining([
        expect.objectContaining({
          params: expect.objectContaining({
            timeRange: customTimeRange,
          }),
        }),
      ])
    );
  });
});
