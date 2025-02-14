/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import datemath from '@opensearch/datemath';
import {
  convertResult,
  DATA_FRAME_TYPES,
  formatTimePickerDate,
  IDataFrameErrorResponse,
  IDataFrameResponse,
} from '.';
import moment from 'moment';

describe('formatTimePickerDate', () => {
  const mockDateFormat = 'YYYY-MM-DD HH:mm:ss';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle date range with rounding', () => {
    jest.spyOn(datemath, 'parse');

    const result = formatTimePickerDate({ from: 'now/d', to: 'now/d' }, mockDateFormat);

    expect(result.fromDate).not.toEqual(result.toDate);

    expect(datemath.parse).toHaveBeenCalledTimes(2);
    expect(datemath.parse).toHaveBeenCalledWith('now/d', { roundUp: undefined });
    expect(datemath.parse).toHaveBeenCalledWith('now/d', { roundUp: true });
  });
});

describe('convertResult', () => {
  const mockDateString = '2025-02-13 00:51:50';
  const expectedFormattedDate = moment.utc(mockDateString).format('YYYY-MM-DDTHH:mm:ssZ');

  it('should handle empty response', () => {
    const response: IDataFrameResponse = {
      took: 0,
      timed_out: false,
      _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 0,
        max_score: 0,
        hits: [],
      },
      body: {
        fields: [],
        size: 0,
        name: 'test-index',
        values: [],
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult(response);
    expect(result.hits.hits).toEqual([]);
    expect(result.took).toBe(0);
  });

  it('should convert simple date fields', () => {
    const response: IDataFrameResponse = {
      took: 100,
      timed_out: false,
      _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 0,
        max_score: 0,
        hits: [],
      },
      body: {
        fields: [
          { name: 'timestamp', type: 'date', values: [mockDateString] },
          { name: 'message', type: 'keyword', values: ['test message'] },
        ],
        size: 1,
        name: 'test-index',
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult(response);
    expect(result.hits.hits[0]._source.timestamp).toBe(expectedFormattedDate);
    expect(result.hits.hits[0]._source.message).toBe('test message');
  });

  it('should handle nested objects with dates', () => {
    const response: IDataFrameResponse = {
      took: 100,
      timed_out: false,
      _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 0,
        max_score: 0,
        hits: [],
      },
      body: {
        fields: [
          {
            name: 'metadata',
            type: 'object',
            values: [{ created_at: mockDateString, status: 'active' }],
          },
        ],
        size: 1,
        name: 'test-index',
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult(response);
    expect(result.hits.hits[0]._source.metadata.created_at).toBe(expectedFormattedDate);
    expect(result.hits.hits[0]._source.metadata.status).toBe('active');
  });

  it('should handle aggregations with date histogram', () => {
    const response: IDataFrameResponse = {
      took: 100,
      timed_out: false,
      _shards: {
        total: 1,
        successful: 1,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 0,
        max_score: 0,
        hits: [],
      },
      body: {
        fields: [],
        size: 0,
        name: 'test-index',
        aggs: {
          timestamp_histogram: [
            { key: mockDateString, value: 10 },
            { key: '2025-02-13 01:51:50', value: 20 },
          ],
        },
        meta: {
          date_histogram: true,
        },
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult(response);
    expect(result.aggregations?.timestamp_histogram.buckets).toHaveLength(2);
    expect(result.aggregations?.timestamp_histogram.buckets[0].doc_count).toBe(10);
  });

  it('should handle error response', () => {
    const errorResponse: IDataFrameErrorResponse = {
      type: DATA_FRAME_TYPES.ERROR,
      took: 0,
      body: {
        error: 'Some error message',
        timed_out: false,
        took: 0,
        _shards: {
          total: 1,
          successful: 1,
          skipped: 0,
          failed: 0,
        },
        hits: {
          total: 0,
          max_score: 0,
          hits: [],
        },
      },
    };

    const result = convertResult(errorResponse as IDataFrameResponse);
    expect(result).toEqual(errorResponse);
  });
});
