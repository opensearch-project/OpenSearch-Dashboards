/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDimensions } from './get_dimensions';
import moment from 'moment';
import dateMath from '@elastic/datemath';
import { search } from '../../../../../../data/public';
import { dataPluginMock } from '../../../../../../data/public/mocks';
import {
  calculateBounds,
  IBucketDateHistogramAggConfig,
  IAggConfigs,
} from '../../../../../../data/common';

describe('getDimensions', () => {
  it('should return dimensions when buckets and bounds are defined', () => {
    const dataMock = dataPluginMock.createStartContract();
    dataMock.query.timefilter.timefilter.getTime = () => {
      return { from: '2021-01-01T00:00:00.000Z', to: '2021-01-31T00:00:00.000Z' };
    };
    dataMock.query.timefilter.timefilter.calculateBounds = (timeRange) => {
      return calculateBounds(timeRange);
    };

    const metric = {
      toSerializedFieldFormat: jest.fn(() => 'metric-format'),
      makeLabel: jest.fn(() => 'metric-label'),
    };
    const agg = {
      params: { timeRange: null },
      buckets: {
        getInterval: jest.fn(() => ({ opensearchUnit: 'day', opensearchValue: 1 })),
        getScaledDateFormat: jest.fn(() => 'scaled-date-format'),
        getBounds: jest.fn(() => 'bounds'),
      },
      makeLabel: jest.fn(() => 'agg-label'),
      toSerializedFieldFormat: jest.fn(() => 'agg-format'),
    };
    const aggs: IAggConfigs = {
      aggs: [metric, agg],
    };

    // Mocking external dependencies
    dateMath.parse = jest.fn((date, options) => moment(date));
    search.aggs.isDateHistogramBucketAggConfig = jest.fn(
      (bucketAgg: any): bucketAgg is IBucketDateHistogramAggConfig => true
    );

    const result = getDimensions(aggs, dataMock);

    expect(result).toEqual({
      x: {
        accessor: 0,
        label: 'agg-label',
        format: 'agg-format',
        params: {
          date: true,
          interval: moment.duration(1, 'day'),
          intervalOpenSearchValue: 1,
          intervalOpenSearchUnit: 'day',
          format: 'scaled-date-format',
          bounds: 'bounds',
        },
      },
      y: {
        accessor: 1,
        format: 'metric-format',
        label: 'metric-label',
      },
    });
  });
});
