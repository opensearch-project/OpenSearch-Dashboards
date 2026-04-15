/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  parseResponseToOptions,
  filterOptionsByRegex,
  executeQueryForOptions,
} from './variable_query_utils';

describe('parseResponseToOptions', () => {
  it('should return empty array for undefined response', () => {
    expect(parseResponseToOptions(undefined)).toEqual([]);
  });

  it('should return empty array for empty hits', () => {
    expect(parseResponseToOptions({ hits: { hits: [] } })).toEqual([]);
  });

  it('should extract string values from _source', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api' } },
          { _source: { service: 'web' } },
          { _source: { service: 'worker' } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api', 'web', 'worker']);
  });

  it('should deduplicate values', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api' } },
          { _source: { service: 'api' } },
          { _source: { service: 'web' } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api', 'web']);
  });

  it('should convert numbers to strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { status: 200 } }, { _source: { status: 404 } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['200', '404']);
  });

  it('should convert booleans to strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { active: true } }, { _source: { active: false } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['true', 'false']);
  });

  it('should flatten array values', () => {
    const response = {
      hits: {
        hits: [{ _source: { tags: ['a', 'b'] } }, { _source: { tags: ['c'] } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['a', 'b', 'c']);
  });

  it('should skip null and undefined values', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: null } },
          { _source: { service: 'api' } },
          { _source: { service: undefined } },
        ],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should skip empty strings', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: '' } }, { _source: { service: 'api' } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should skip object values', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: { nested: 'value' } } }, { _source: { service: 'api' } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['api']);
  });

  it('should return empty array when _source is missing', () => {
    const response = {
      hits: {
        hits: [{ fields: { service: ['api'] } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual([]);
  });
});

describe('filterOptionsByRegex', () => {
  const options = ['prod-api', 'prod-web', 'staging-api', 'dev-worker', 'PROD-DB'];

  it('should return all options when regex is undefined', () => {
    expect(filterOptionsByRegex(options, undefined)).toEqual(options);
  });

  it('should return all options when regex is empty string', () => {
    expect(filterOptionsByRegex(options, '')).toEqual(options);
  });

  it('should filter options with a plain regex string', () => {
    expect(filterOptionsByRegex(options, '^prod')).toEqual(['prod-api', 'prod-web']);
  });

  it('should filter options with /pattern/ syntax', () => {
    expect(filterOptionsByRegex(options, '/^prod/')).toEqual(['prod-api', 'prod-web']);
  });

  it('should support /pattern/flags syntax', () => {
    expect(filterOptionsByRegex(options, '/^prod/i')).toEqual(['prod-api', 'prod-web', 'PROD-DB']);
  });

  it('should return all options for invalid regex', () => {
    expect(filterOptionsByRegex(options, '/[invalid')).toEqual(options);
  });

  it('should return empty array when no options match', () => {
    expect(filterOptionsByRegex(options, '^xyz')).toEqual([]);
  });

  it('should work with partial match', () => {
    expect(filterOptionsByRegex(options, 'api')).toEqual(['prod-api', 'staging-api']);
  });
});

describe('executeQueryForOptions', () => {
  const mockSetField = jest.fn();
  const mockFetch = jest.fn();
  const mockCreate = jest.fn().mockResolvedValue({
    setField: mockSetField,
    fetch: mockFetch,
  });

  const mockDataPlugin = {
    search: {
      searchSource: {
        create: mockCreate,
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({
      setField: mockSetField,
      fetch: mockFetch,
    });
    mockFetch.mockResolvedValue({ hits: { hits: [] } });
  });

  it('should return empty array for empty query', async () => {
    const result = await executeQueryForOptions(mockDataPlugin, {
      query: '',
      language: 'PPL',
    });
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set skipFilters on the search source', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: 'source=logs | dedup service | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'test', type: 'INDEX_PATTERN' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'source=logs | dedup service | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'test', type: 'INDEX_PATTERN' },
    });
    expect(mockSetField).toHaveBeenCalledWith('skipFilters', true);
  });

  it('should pass abort signal to fetch', async () => {
    const controller = new AbortController();
    await executeQueryForOptions(
      mockDataPlugin,
      { query: 'source=logs | fields service', language: 'PPL' },
      controller.signal
    );

    expect(mockFetch).toHaveBeenCalledWith({ abortSignal: controller.signal });
  });

  it('should parse response and return options', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [{ _source: { service: 'api' } }, { _source: { service: 'web' } }],
      },
    });

    const result = await executeQueryForOptions(mockDataPlugin, {
      query: 'source=logs | dedup service | fields service',
      language: 'PPL',
    });

    expect(result).toEqual(['api', 'web']);
  });
});
