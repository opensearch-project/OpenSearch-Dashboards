/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildVariableOptionsFromQueryResult,
  parseResponseToQueryResult,
  filterVariableOptionsByRegex,
  executeVariableQuery,
} from './variable_query_utils';

describe('parseResponseToQueryResult', () => {
  it('should return empty metadata for undefined response', () => {
    expect(parseResponseToQueryResult(undefined)).toEqual({
      rows: [],
      fields: [],
      fieldTypes: {},
    });
  });

  it('should return empty metadata for empty hits', () => {
    expect(parseResponseToQueryResult({ hits: { hits: [] } })).toEqual({
      rows: [],
      fields: [],
      fieldTypes: {},
    });
  });

  it('should return rows, ordered fields, and field types from _source', () => {
    const response = {
      hits: {
        hits: [
          { _source: { service: 'api', product_id: 6283 } },
          { _source: { active: true, service: 'web' } },
        ],
      },
    };

    expect(parseResponseToQueryResult(response)).toEqual({
      rows: [
        { service: 'api', product_id: 6283 },
        { active: true, service: 'web' },
      ],
      fields: ['service', 'product_id', 'active'],
      fieldTypes: {
        service: 'string',
        product_id: 'number',
        active: 'boolean',
      },
    });
  });

  it('should ignore hits without object _source', () => {
    const response = {
      hits: {
        hits: [
          { fields: { service: ['api'] } },
          { _source: ['not-row'] },
          { _source: { service: 'web' } },
        ],
      },
    };

    expect(parseResponseToQueryResult(response)).toEqual({
      rows: [{ service: 'web' }],
      fields: ['service'],
      fieldTypes: { service: 'string' },
    });
  });
});

describe('buildVariableOptionsFromQueryResult', () => {
  it('should preserve first-field behavior when valueField is unset', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [
          { _source: { service: 'api', name: 'API' } },
          { _source: { service: 'web', name: 'Web' } },
        ],
      },
    });

    expect(buildVariableOptionsFromQueryResult(result)).toEqual({
      options: [{ value: 'api' }, { value: 'web' }],
      optionType: 'string',
    });
  });

  it('should use the configured value field', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [
          { _source: { name: 'API', service_id: 'svc-1' } },
          { _source: { name: 'Web', service_id: 'svc-2' } },
        ],
      },
    });

    expect(buildVariableOptionsFromQueryResult(result, { valueField: 'service_id' })).toEqual({
      options: [{ value: 'svc-1' }, { value: 'svc-2' }],
      optionType: 'string',
    });
  });

  it('should return empty options when configured value field is missing', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [{ _source: { service: 'api' } }],
      },
    });

    expect(buildVariableOptionsFromQueryResult(result, { valueField: 'missing' })).toEqual({
      options: [],
      optionType: undefined,
    });
  });

  it('should use configured scalar label field', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [
          { _source: { service_id: 'svc-1', service_name: 'API service' } },
          { _source: { service_id: 'svc-2', service_name: 'Web service' } },
        ],
      },
    });

    expect(
      buildVariableOptionsFromQueryResult(result, {
        valueField: 'service_id',
        labelField: 'service_name',
      })
    ).toEqual({
      options: [
        { value: 'svc-1', label: 'API service' },
        { value: 'svc-2', label: 'Web service' },
      ],
      optionType: 'string',
    });
  });

  it('should omit labels when label field is unset or missing', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [{ _source: { service_id: 'svc-1', service_name: 'API service' } }],
      },
    });

    expect(
      buildVariableOptionsFromQueryResult(result, {
        valueField: 'service_id',
        labelField: 'missing',
      })
    ).toEqual({
      options: [{ value: 'svc-1' }],
      optionType: 'string',
    });
  });

  it('should flatten array values and omit labels for those values', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [{ _source: { service_id: ['svc-1', 'svc-2'], service_name: 'Shared label' } }],
      },
    });

    expect(
      buildVariableOptionsFromQueryResult(result, {
        valueField: 'service_id',
        labelField: 'service_name',
      })
    ).toEqual({
      options: [{ value: 'svc-1' }, { value: 'svc-2' }],
      optionType: 'string',
    });
  });

  it('should return no options for array values containing objects', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [
          {
            _source: {
              products: [
                { product_name: 'Shirt', sku: 'sku-1' },
                { product_name: 'Shoes', sku: 'sku-2' },
              ],
            },
          },
        ],
      },
    });

    expect(buildVariableOptionsFromQueryResult(result, { valueField: 'products' })).toEqual({
      options: [],
      optionType: undefined,
    });
  });

  it('should deduplicate by value and keep the first non-empty label', () => {
    const result = parseResponseToQueryResult({
      hits: {
        hits: [
          { _source: { service_id: 'svc-1', service_name: '' } },
          { _source: { service_id: 'svc-1', service_name: 'API service' } },
          { _source: { service_id: 'svc-1', service_name: 'Duplicate label' } },
        ],
      },
    });

    expect(
      buildVariableOptionsFromQueryResult(result, {
        valueField: 'service_id',
        labelField: 'service_name',
      })
    ).toEqual({
      options: [{ value: 'svc-1', label: 'API service' }],
      optionType: 'string',
    });
  });
});

describe('filterVariableOptionsByRegex', () => {
  const options = [
    { value: 'prod-api', label: 'Production API' },
    { value: 'staging-api', label: 'Production-like label' },
    { value: 'dev-worker' },
  ];

  it('should filter normalized options by value', () => {
    expect(filterVariableOptionsByRegex(options, '^prod')).toEqual([
      { value: 'prod-api', label: 'Production API' },
    ]);
  });

  it('should return original normalized options for invalid regex', () => {
    expect(filterVariableOptionsByRegex(options, '/[invalid')).toEqual(options);
  });

  it('should return all normalized options when regex is undefined or empty', () => {
    expect(filterVariableOptionsByRegex(options, undefined)).toEqual(options);
    expect(filterVariableOptionsByRegex(options, '')).toEqual(options);
  });

  it('should support /pattern/flags syntax', () => {
    expect(filterVariableOptionsByRegex(options, '/^prod/i')).toEqual([
      { value: 'prod-api', label: 'Production API' },
    ]);
  });

  it('should return empty array when no options match', () => {
    expect(filterVariableOptionsByRegex(options, '^qa')).toEqual([]);
  });

  it('should return all options when every value matches', () => {
    expect(filterVariableOptionsByRegex(options, 'api|worker')).toEqual(options);
  });
});

describe('executeVariableQuery', () => {
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

  it('should return empty metadata for empty query', async () => {
    const result = await executeVariableQuery(mockDataPlugin, {
      query: '',
      language: 'PPL',
    });
    expect(result).toEqual({ rows: [], fields: [], fieldTypes: {} });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should set skipFilters on the search source', async () => {
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(mockDataPlugin, {
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
    await executeVariableQuery(
      mockDataPlugin,
      { query: 'source=logs | fields service', language: 'PPL' },
      controller.signal
    );

    expect(mockFetch).toHaveBeenCalledWith({ abortSignal: controller.signal });
  });

  it('should parse response and return query result metadata', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [{ _source: { service: 'api' } }, { _source: { service: 'web' } }],
      },
    });

    const result = await executeVariableQuery(mockDataPlugin, {
      query: 'source=logs | dedup service | fields service',
      language: 'PPL',
    });

    expect(result).toEqual({
      rows: [{ service: 'api' }, { service: 'web' }],
      fields: ['service'],
      fieldTypes: { service: 'string' },
    });
  });

  it('should detect number type correctly', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [
          { _source: { product_id: 6283 } },
          { _source: { product_id: 120 } },
          { _source: { product_id: 223 } },
        ],
      },
    });

    const result = await executeVariableQuery(mockDataPlugin, {
      query: 'source=logs | dedup product_id | fields product_id',
      language: 'PPL',
    });

    expect(result).toEqual({
      rows: [{ product_id: 6283 }, { product_id: 120 }, { product_id: 223 }],
      fields: ['product_id'],
      fieldTypes: { product_id: 'number' },
    });
  });

  it('should detect boolean type correctly', async () => {
    mockFetch.mockResolvedValue({
      hits: {
        hits: [{ _source: { active: true } }, { _source: { active: false } }],
      },
    });

    const result = await executeVariableQuery(mockDataPlugin, {
      query: 'source=logs | dedup active | fields active',
      language: 'PPL',
    });

    expect(result).toEqual({
      rows: [{ active: true }, { active: false }],
      fields: ['active'],
      fieldTypes: { active: 'boolean' },
    });
  });

  it('should skip time filter by default', async () => {
    await executeVariableQuery(mockDataPlugin, {
      query: 'source=logs | fields service',
      language: 'PPL',
    });

    expect(mockSetField).toHaveBeenCalledWith('skipTimeFilter', true);
  });

  it('should not skip time filter when useTimeFilter is true', async () => {
    await executeVariableQuery(
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
