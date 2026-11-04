/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
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

  describe("with a source's getFields", () => {
    const cloudDataset = { id: 'cloud::us-east-1::app', type: 'CLOUD' };

    beforeEach(() => {
      mockGetQuery.mockReturnValue({ dataset: cloudDataset } as any);
      mockUseDatasetContext.mockReturnValue({
        dataset: datasetWithFields([{ name: '@message' }, { name: 'latency', type: 'number' }]),
      });
    });

    it("adds the source's fields and fills in what the dataset's lack", async () => {
      const getFields = jest.fn().mockResolvedValue([
        { name: '@message', type: 'string', aggregatable: true },
        { name: 'service', type: 'string', aggregatable: true },
        { name: 'latency', type: 'string' },
      ]);

      const { result } = renderHook(() => useFieldData(undefined, { getFields, refreshKey: 'a' }));

      await waitFor(() => expect(result.current.fieldNames).toContain('service'));
      expect(getFields).toHaveBeenCalledWith(cloudDataset);
      expect(result.current.fieldNames).toEqual(['@message', 'latency', 'service']);
      // The dataset's own type wins; the source only fills a missing one.
      expect(result.current.getFieldType('latency')).toBe('number');
      expect(result.current.getFieldType('@message')).toBe('string');
      // Aggregatable strings are offered for any-field aggregations.
      expect(result.current.numericAndAggregatableNames).toEqual([
        '@message',
        'latency',
        'service',
      ]);
    });

    it('offers a field of unknown type for numeric aggregations, typed fields as typed', async () => {
      const getFields = jest.fn().mockResolvedValue([{ name: 'duration', aggregatable: true }]);

      const { result } = renderHook(() => useFieldData(undefined, { getFields, refreshKey: 'a' }));

      await waitFor(() => expect(result.current.fieldNames).toContain('duration'));
      // `@message` has no type in this dataset either, so it may hold numbers too.
      expect(result.current.numericFieldNames).toEqual(['@message', 'latency', 'duration']);
      expect(result.current.getFieldType('duration')).toBeUndefined();
    });

    it('asks again when a query finishes, not while one runs', async () => {
      const getFields = jest.fn().mockResolvedValue([]);
      const { rerender } = renderHook(
        ({ refreshKey }: { refreshKey: string | null }) =>
          useFieldData(undefined, { getFields, refreshKey }),
        { initialProps: { refreshKey: 'ready:1' as string | null } }
      );
      await waitFor(() => expect(getFields).toHaveBeenCalledTimes(1));

      rerender({ refreshKey: null });
      rerender({ refreshKey: 'ready:2' });

      await waitFor(() => expect(getFields).toHaveBeenCalledTimes(2));
    });

    it("drops the last dataset's source fields when the dataset changes", async () => {
      const getFields = jest
        .fn()
        .mockResolvedValueOnce([{ name: 'service', type: 'string' }])
        .mockRejectedValueOnce(new Error('offline'));
      const datasetA = datasetWithFields([{ name: '@message' }]);
      const datasetB = datasetWithFields([{ name: '@message' }]);
      const { result, rerender } = renderHook(
        ({ dataset, refreshKey }: { dataset: any; refreshKey: string | null }) =>
          useFieldData(dataset, { getFields, refreshKey }),
        { initialProps: { dataset: datasetA, refreshKey: 'ready:1' as string | null } }
      );
      await waitFor(() => expect(result.current.fieldNames).toContain('service'));

      // B's query is still running: A's `service` is gone already.
      rerender({ dataset: datasetB, refreshKey: null });
      expect(result.current.fieldNames).toEqual(['@message']);

      // B's query finished, but asking for its fields failed: still not A's.
      rerender({ dataset: datasetB, refreshKey: 'ready:2' });
      await waitFor(() => expect(getFields).toHaveBeenCalledTimes(2));
      expect(result.current.fieldNames).toEqual(['@message']);
    });

    it("keeps the dataset's fields when getFields fails", async () => {
      const getFields = jest.fn().mockRejectedValue(new Error('offline'));

      const { result } = renderHook(() => useFieldData(undefined, { getFields, refreshKey: 'a' }));

      await waitFor(() => expect(getFields).toHaveBeenCalled());
      expect(result.current.fieldNames).toEqual(['@message', 'latency']);
    });
  });
});
