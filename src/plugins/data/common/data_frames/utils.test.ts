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
import { ISearchOptions, SearchSourceFields } from '../search';
import { IIndexPatternFieldList, IndexPattern, IndexPatternField } from '../index_patterns';
import { OSD_FIELD_TYPES } from '../types';

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
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        values: [],
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult({ response });
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

    // Custom date formatter
    const customFormatter = (dateStr: string, type: OSD_FIELD_TYPES) => {
      if (type === OSD_FIELD_TYPES.DATE) {
        return moment.utc(dateStr).format('YYYY-MM-DDTHH:mm:ssZ');
      }
    };

    const options: ISearchOptions = {
      formatter: customFormatter,
    };

    const result = convertResult({ response, options });
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

    // Create proper IndexPatternField instances
    const createdAtField = new IndexPatternField(
      {
        name: 'metadata.created_at',
        type: 'date',
        esTypes: ['date'],
        searchable: true,
        aggregatable: true,
      },
      'metadata.created_at'
    );

    const statusField = new IndexPatternField(
      {
        name: 'metadata.status',
        type: 'keyword',
        esTypes: ['keyword'],
        searchable: true,
        aggregatable: true,
      },
      'metadata.status'
    );

    // Create a mock of IIndexPatternFieldList with the required methods
    const mockFields = [createdAtField, statusField] as IIndexPatternFieldList;
    // Add required methods
    mockFields.getAll = jest.fn().mockReturnValue([createdAtField, statusField]);
    mockFields.getByName = jest.fn((name) =>
      name === 'metadata.created_at'
        ? createdAtField
        : name === 'metadata.status'
        ? statusField
        : undefined
    );
    mockFields.getByType = jest.fn((type) =>
      type === 'date' ? [createdAtField] : type === 'keyword' ? [statusField] : []
    );

    // Mock IndexPattern with fields property using IIndexPatternFieldList
    // @ts-expect-error TS2740 TODO(ts-error): fixme
    const mockIndexPattern: IndexPattern = {
      fields: mockFields,
      title: 'test-index',
      timeFieldName: 'timestamp',
    };

    // Correctly structured SearchSourceFields
    const fields: SearchSourceFields = {
      index: mockIndexPattern,
    };

    // Custom date formatter
    const customFormatter = (dateStr: string, type: OSD_FIELD_TYPES) => {
      if (type === OSD_FIELD_TYPES.DATE) {
        return moment.utc(dateStr).format('YYYY-MM-DDTHH:mm:ssZ');
      }
    };

    const options: ISearchOptions = {
      formatter: customFormatter,
    };

    const result = convertResult({ response, fields, options });
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

    const result = convertResult({ response });
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

    const result = convertResult({ response: errorResponse as IDataFrameResponse });
    expect(result).toEqual(errorResponse);
  });

  it('should use default processing when no formatter is provided', () => {
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
        fields: [{ name: 'timestamp', type: 'date', values: [mockDateString] }],
        size: 1,
        name: 'test-index',
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    const result = convertResult({ response });
    expect(result.hits.hits[0]._source.timestamp).toBe(mockDateString);
  });

  it('should handle null or undefined objects', () => {
    const response: IDataFrameResponse = {
      took: 100,
      timed_out: false,
      _shards: {
        total: 2,
        successful: 2,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 0,
        max_score: 0,
        hits: [],
      },
      body: {
        fields: [{ name: 'foo', type: 'object', values: [null, undefined] }],
        size: 2,
        name: 'test-index',
      },
      type: DATA_FRAME_TYPES.DEFAULT,
    };

    // Custom date formatter
    const customFormatter = (dateStr: string, type: OSD_FIELD_TYPES) => {
      if (type === OSD_FIELD_TYPES.DATE) {
        return moment.utc(dateStr).format('YYYY-MM-DDTHH:mm:ssZ');
      }
    };

    const options: ISearchOptions = {
      formatter: customFormatter,
    };

    const result = convertResult({ response, options });
    expect(result.hits.hits[0]._source.foo).toBe(null);
    expect(result.hits.hits[1]._source.foo).toBe(undefined);
  });
});
