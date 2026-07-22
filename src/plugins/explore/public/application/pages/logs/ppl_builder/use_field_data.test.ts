/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useFieldData } from './use_field_data';
import { fetchColumnValues } from '../../../../../../data/public';

const mockUseDatasetContext = jest.fn();
const mockGetQuery = jest.fn(() => ({ dataset: { type: 'INDEX_PATTERN' } }));

jest.mock('../../../../../../data/public', () => ({
  fetchColumnValues: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: { autocomplete: {}, query: { queryString: { getQuery: mockGetQuery } } },
    },
  }),
}));

jest.mock('../../../context', () => ({
  useDatasetContext: () => mockUseDatasetContext(),
}));

const datasetWithFields = (
  fields: Array<{ name: string; type?: string; aggregatable?: boolean; subType?: unknown }>
) => ({
  timeFieldName: '@timestamp',
  fields: { getAll: () => fields },
});

describe('useFieldData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('drops a `.keyword` multi-field, mirroring the code editor autocomplete', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: datasetWithFields([
        { name: 'machine.os', type: 'string', aggregatable: false },
        {
          name: 'machine.os.keyword',
          type: 'string',
          aggregatable: true,
          subType: { multi: { parent: 'machine.os' } },
        },
      ]),
    });

    const { result } = renderHook(() => useFieldData());

    expect(result.current.fieldNames).toEqual(['machine.os']);
  });

  it('keeps a top-level keyword field that has no multi-field subType', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: datasetWithFields([{ name: 'tags', type: 'string', aggregatable: true }]),
    });

    const { result } = renderHook(() => useFieldData());

    expect(result.current.fieldNames).toEqual(['tags']);
  });

  it('excludes underscore-prefixed and multi-field keyword fields together', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: datasetWithFields([
        { name: '_id' },
        { name: 'service' },
        { name: 'service.keyword', subType: { multi: { parent: 'service' } } },
        { name: 'bytes', type: 'number' },
      ]),
    });

    const { result } = renderHook(() => useFieldData());

    expect(result.current.fieldNames).toEqual(['service', 'bytes']);
  });

  it('excludes date-typed fields from group-by options (time grouping is "over time")', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: datasetWithFields([
        { name: '@timestamp', type: 'date' },
        { name: 'service' },
        { name: 'bytes', type: 'number' },
      ]),
    });

    const { result } = renderHook(() => useFieldData());

    expect(result.current.fieldNames).toEqual(['@timestamp', 'service', 'bytes']);
    expect(result.current.groupByFieldNames).toEqual(['service', 'bytes']);
  });

  it('sources datasetType from the query service (not the DataView) and forwards the search term', async () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { title: 'logs-*', type: undefined, fields: { getAll: () => [] } },
    });

    const { result } = renderHook(() => useFieldData());
    await result.current.getValues('agent', 'MSIE');

    expect(fetchColumnValues).toHaveBeenCalledWith(
      'logs-*',
      'agent',
      expect.anything(),
      expect.anything(),
      'INDEX_PATTERN',
      undefined,
      'MSIE'
    );
  });

  it('falls back to the DataView type when the query service has no dataset', async () => {
    mockGetQuery.mockReturnValueOnce({ dataset: undefined } as any);
    mockUseDatasetContext.mockReturnValue({
      dataset: { title: 'logs-*', type: 'INDEX_PATTERN', fields: { getAll: () => [] } },
    });

    const { result } = renderHook(() => useFieldData());
    await result.current.getValues('agent');

    expect(fetchColumnValues).toHaveBeenCalledWith(
      'logs-*',
      'agent',
      expect.anything(),
      expect.anything(),
      'INDEX_PATTERN',
      undefined,
      undefined
    );
  });
});
