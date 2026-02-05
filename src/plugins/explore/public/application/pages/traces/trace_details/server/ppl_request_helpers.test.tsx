/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import {
  buildPPLDataset,
  buildPPLQueryRequest,
  executePPLQuery,
  escapePPLValue,
  PPLService,
} from './ppl_request_helpers';

describe('ppl_request_helpers', () => {
  const createMockDataset = () => ({
    id: 'test-dataset-id',
    title: 'test-index',
    type: 'INDEX_PATTERN',
    timeFieldName: 'endTime',
  });

  describe('buildPPLDataset', () => {
    it('builds dataset object with correct structure', () => {
      const dataset = createMockDataset();
      const result = buildPPLDataset(dataset);
      expect(result).toEqual({
        id: 'test-dataset-id',
        title: 'test-index',
        type: 'INDEX_PATTERN',
        timeFieldName: 'endTime',
      });
    });

    it('handles dataset without timeFieldName', () => {
      const dataset = {
        id: 'test-dataset-id',
        title: 'test-index',
        type: 'INDEX_PATTERN',
      };
      const result = buildPPLDataset(dataset);
      expect(result).toEqual({
        id: 'test-dataset-id',
        title: 'test-index',
        type: 'INDEX_PATTERN',
        timeFieldName: undefined,
      });
    });

    it('includes dataSource when present (external data source)', () => {
      const datasetWithDataSource = {
        ...createMockDataset(),
        dataSource: {
          id: 'external-datasource-id',
          title: 'external',
          type: 'OpenSearch',
        },
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = buildPPLDataset(datasetWithDataSource);
      expect(result).toEqual({
        id: 'test-dataset-id',
        title: 'test-index',
        type: 'INDEX_PATTERN',
        timeFieldName: 'endTime',
        dataSource: {
          id: 'external-datasource-id',
          title: 'external',
          type: 'OpenSearch',
        },
      });
    });
  });

  describe('buildPPLQueryRequest', () => {
    it('builds query request with correct structure', () => {
      const dataset = createMockDataset();
      const result = buildPPLQueryRequest(dataset, 'source = test-index');
      expect(result).toEqual({
        params: {
          index: 'test-index',
          body: {
            query: {
              query: 'source = test-index',
              language: 'PPL',
              format: 'jdbc',
              dataset: buildPPLDataset(dataset),
            },
          },
        },
      });
    });

    it('integrates dataset correctly', () => {
      const dataset = createMockDataset();
      const result = buildPPLQueryRequest(dataset, 'source = test-index');
      expect(result.params.body.query.dataset).toEqual(buildPPLDataset(dataset));
    });

    it('includes aggConfig when provided (external data source)', () => {
      const dataset = createMockDataset();
      const aggConfig = {
        date_histogram: {
          field: 'endTime',
          fixed_interval: '5s',
          time_zone: 'America/Los_Angeles',
          min_doc_count: 1,
        },
      };
      const result = buildPPLQueryRequest(dataset, 'source = test-index', aggConfig);
      expect(result.params.body.aggConfig).toEqual(aggConfig);
    });

    it('works with external data source dataset', () => {
      const datasetWithDataSource = {
        ...createMockDataset(),
        dataSource: {
          id: 'external-datasource-id',
          title: 'external',
          type: 'OpenSearch',
        },
      };
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      const result = buildPPLQueryRequest(datasetWithDataSource, 'source = test-index');
      expect(result.params.body.query.dataset.dataSource).toEqual({
        id: 'external-datasource-id',
        title: 'external',
        type: 'OpenSearch',
      });
    });
  });

  describe('executePPLQuery', () => {
    const mockDataService = ({
      query: {
        queryString: {
          setQuery: jest.fn(),
        },
      },
      search: {
        search: jest.fn(),
      },
    } as unknown) as DataPublicPluginStart;

    const mockRequest = buildPPLQueryRequest(createMockDataset(), 'source = test-index');

    beforeEach(() => {
      jest.clearAllMocks();
      (mockDataService.search.search as jest.Mock).mockReturnValue({
        toPromise: () => Promise.resolve({ hits: [] }),
      });
    });

    it('executes query successfully', async () => {
      await executePPLQuery(mockDataService, mockRequest);
      expect(mockDataService.query.queryString.setQuery).toHaveBeenCalledWith(
        mockRequest.params.body.query
      );
      expect(mockDataService.search.search).toHaveBeenCalledWith(mockRequest, {});
    });

    it('throws error when data service is not available', async () => {
      await expect(executePPLQuery(null as any, mockRequest)).rejects.toThrow(
        'Data service is not available'
      );
    });

    it('handles search errors', async () => {
      const error = new Error('Search failed');
      (mockDataService.search.search as jest.Mock).mockReturnValue({
        toPromise: () => Promise.reject(error),
      });

      await expect(executePPLQuery(mockDataService, mockRequest)).rejects.toThrow(error);
    });
  });

  describe('escapePPLValue', () => {
    it('escapes string values', () => {
      expect(escapePPLValue('test')).toBe('"test"');
      expect(escapePPLValue('test"quote')).toBe('"test\\"quote"');
      expect(escapePPLValue('test\\backslash')).toBe('"test\\backslash"');
    });

    it('handles number values', () => {
      expect(escapePPLValue(123)).toBe('123');
      expect(escapePPLValue(123.456)).toBe('123.456');
      expect(escapePPLValue(-123)).toBe('-123');
    });

    it('handles boolean values', () => {
      expect(escapePPLValue(true)).toBe('true');
      expect(escapePPLValue(false)).toBe('false');
    });

    it('handles object values', () => {
      const obj = { key: 'value' };
      const result = escapePPLValue(obj);
      expect(result).toContain('key');
      expect(result).toContain('value');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
    });

    it('handles array values', () => {
      const arr = ['test', 123];
      const result = escapePPLValue(arr);
      expect(result).toContain('test');
      expect(result).toContain('123');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
    });

    it('handles null and undefined', () => {
      expect(escapePPLValue(null)).toBe('"null"');
      expect(escapePPLValue(undefined)).toBe('"undefined"');
    });
  });

  describe('PPLService', () => {
    const mockDataService = ({
      query: {
        queryString: {
          setQuery: jest.fn(),
        },
      },
      search: {
        search: jest.fn(),
      },
    } as unknown) as DataPublicPluginStart;

    let pplService: PPLService;

    beforeEach(() => {
      jest.clearAllMocks();
      pplService = new PPLService(mockDataService);
      (mockDataService.search.search as jest.Mock).mockReturnValue({
        toPromise: () => Promise.resolve({ hits: [] }),
      });
    });

    it('executes query with valid parameters', async () => {
      const dataset = createMockDataset();
      await pplService.executeQuery(dataset, 'source = test-index');
      expect(mockDataService.search.search).toHaveBeenCalled();
    });

    it('throws error with missing dataset', async () => {
      await expect(pplService.executeQuery(null as any, 'source = test-index')).rejects.toThrow(
        'Missing required parameters'
      );
    });

    it('throws error with missing query', async () => {
      const dataset = createMockDataset();
      await expect(pplService.executeQuery(dataset, '')).rejects.toThrow(
        'Missing required parameters'
      );
    });

    it('handles search errors', async () => {
      const error = new Error('Search failed');
      (mockDataService.search.search as jest.Mock).mockReturnValue({
        toPromise: () => Promise.reject(error),
      });

      const dataset = createMockDataset();
      await expect(pplService.executeQuery(dataset, 'source = test-index')).rejects.toThrow(error);
    });
  });
});
