/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  parseResponseToOptions,
  parseResponseToOptionsWithType,
  filterOptionsByRegex,
  executeQueryForOptions,
  executeQueryForOptionsWithType,
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

  it('should include empty strings as valid options', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: '' } }, { _source: { service: 'api' } }],
      },
    };
    expect(parseResponseToOptions(response)).toEqual(['', 'api']);
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

describe('parseResponseToOptionsWithType', () => {
  it('should return empty array and undefined type for undefined response', () => {
    expect(parseResponseToOptionsWithType(undefined)).toEqual({
      options: [],
      optionType: undefined,
    });
  });

  it('should return empty array and undefined type for empty hits', () => {
    expect(parseResponseToOptionsWithType({ hits: { hits: [] } })).toEqual({
      options: [],
      optionType: undefined,
    });
  });

  it('should detect string type from first value', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api' } },
          { _source: { service: 'web' } },
          { _source: { service: 'worker' } },
        ],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['api', 'web', 'worker'],
      optionType: 'string',
    });
  });

  it('should detect number type from first value', () => {
    const response = {
      hits: {
        hits: [
          { _source: { product_id: 6283 } },
          { _source: { product_id: 120 } },
          { _source: { product_id: 223 } },
        ],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['6283', '120', '223'],
      optionType: 'number',
    });
  });

  it('should detect boolean type from first value', () => {
    const response = {
      hits: {
        hits: [
          { _source: { active: true } },
          { _source: { active: false } },
          { _source: { active: true } },
        ],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['true', 'false'],
      optionType: 'boolean',
    });
  });

  it('should skip null values when detecting type', () => {
    const response = {
      hits: {
        hits: [
          { _source: { status: null } },
          { _source: { status: 200 } },
          { _source: { status: 404 } },
        ],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['200', '404'],
      optionType: 'number',
    });
  });

  it('should handle array values and detect type from first element', () => {
    const response = {
      hits: {
        hits: [{ _source: { ids: [100, 200] } }, { _source: { ids: [300] } }],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['100', '200', '300'],
      optionType: 'number',
    });
  });

  it('should return string type when first value is a string', () => {
    const response = {
      hits: {
        hits: [{ _source: { mixed: '123' } }, { _source: { mixed: '456' } }],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['123', '456'],
      optionType: 'string',
    });
  });

  it('should deduplicate values while preserving type', () => {
    const response = {
      hits: {
        hits: [
          { _source: { status: 200 } },
          { _source: { status: 200 } },
          { _source: { status: 404 } },
        ],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: ['200', '404'],
      optionType: 'number',
    });
  });

  it('should return undefined type when all values are null', () => {
    const response = {
      hits: {
        hits: [{ _source: { service: null } }, { _source: { service: null } }],
      },
    };
    expect(parseResponseToOptionsWithType(response)).toEqual({
      options: [],
      optionType: undefined,
    });
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
      query: 'source=`logs` | dedup service | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'test', type: 'INDEX_PATTERN' },
    });
    expect(mockSetField).toHaveBeenCalledWith('skipFilters', true);
  });

  it('should automatically add source clause for PPL queries without source', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: '| dedup service | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'source = `logs` | dedup service | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });
  });

  it('should not add source clause for describe command', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: 'describe logs',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'describe logs',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });
  });

  it('should not add source clause for show command', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: 'show tables',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'show tables',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'INDEX_PATTERN' },
    });
  });

  it('should not modify non-PPL queries', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: 'up',
      language: 'PROMQL',
      dataset: { id: 'test', title: 'prometheus', type: 'PROMETHEUS' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'up',
      language: 'PROMQL',
      dataset: { id: 'test', title: 'prometheus', type: 'PROMETHEUS' },
    });
  });

  it('should add backticks for INDEX_PATTERN dataset type', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: '| fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'my-logs', type: 'INDEX_PATTERN' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'source = `my-logs` | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'my-logs', type: 'INDEX_PATTERN' },
    });
  });

  it('should not add backticks for non-INDEX dataset types', async () => {
    await executeQueryForOptions(mockDataPlugin, {
      query: '| fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'OTHER' },
    });

    expect(mockSetField).toHaveBeenCalledWith('query', {
      query: 'source = logs | fields service',
      language: 'PPL',
      dataset: { id: 'test', title: 'logs', type: 'OTHER' },
    });
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

describe('executeQueryForOptionsWithType', () => {
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

  it('should return empty array and undefined type for empty query', async () => {
    const result = await executeQueryForOptionsWithType(mockDataPlugin, {
      query: '',
      language: 'PPL',
    });
    expect(result).toEqual({ options: [], optionType: undefined });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should return options with detected type', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [
          { _source: { product_id: 6283 } },
          { _source: { product_id: 120 } },
          { _source: { product_id: 223 } },
        ],
      },
    });

    const result = await executeQueryForOptionsWithType(mockDataPlugin, {
      query: 'source=logs | dedup product_id | fields product_id',
      language: 'PPL',
    });

    expect(result).toEqual({
      options: ['6283', '120', '223'],
      optionType: 'number',
    });
  });

  it('should detect string type correctly', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [{ _source: { service: 'api' } }, { _source: { service: 'web' } }],
      },
    });

    const result = await executeQueryForOptionsWithType(mockDataPlugin, {
      query: 'source=logs | dedup service | fields service',
      language: 'PPL',
    });

    expect(result).toEqual({
      options: ['api', 'web'],
      optionType: 'string',
    });
  });

  it('should detect boolean type correctly', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [{ _source: { active: true } }, { _source: { active: false } }],
      },
    });

    const result = await executeQueryForOptionsWithType(mockDataPlugin, {
      query: 'source=logs | dedup active | fields active',
      language: 'PPL',
    });

    expect(result).toEqual({
      options: ['true', 'false'],
      optionType: 'boolean',
    });
  });

  it('should skip time filter by default', async () => {
    await executeQueryForOptionsWithType(mockDataPlugin, {
      query: 'source=logs | fields service',
      language: 'PPL',
    });

    expect(mockSetField).toHaveBeenCalledWith('skipTimeFilter', true);
  });

  it('should not skip time filter when useTimeFilter is true', async () => {
    await executeQueryForOptionsWithType(
      mockDataPlugin,
      {
        query: 'source=logs | fields service',
        language: 'PPL',
      },
      undefined,
      true
    );

    expect(mockSetField).not.toHaveBeenCalledWith('skipTimeFilter', true);
  });
});
