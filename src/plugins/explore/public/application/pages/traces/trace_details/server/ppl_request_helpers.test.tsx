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
  describe('buildPPLDataset', () => {
    it('builds dataset object with correct structure', () => {
      const result = buildPPLDataset('test-source', 'test-index');
      expect(result).toEqual({
        dataSource: {
          id: 'test-source',
          title: 'datasource-test-source',
          type: 'DATA_SOURCE',
        },
        id: 'test-source::test-index',
        title: 'test-index',
        type: 'INDEXES',
        isRemoteDataset: false,
      });
    });

    it('handles special characters in dataSourceId and indexPattern', () => {
      const result = buildPPLDataset('source:1', 'index*pattern');
      expect(result.id).toBe('source:1::index*pattern');
      expect(result.dataSource.title).toBe('datasource-source:1');
    });
  });

  describe('buildPPLQueryRequest', () => {
    it('builds query request with correct structure', () => {
      const result = buildPPLQueryRequest('test-source', 'test-index', 'source = test');
      expect(result).toEqual({
        params: {
          index: 'test-source::test-index',
          body: {
            query: {
              query: 'source = test',
              language: 'PPL',
              format: 'jdbc',
              dataset: buildPPLDataset('test-source', 'test-index'),
            },
          },
        },
      });
    });

    it('integrates dataset correctly', () => {
      const result = buildPPLQueryRequest('test-source', 'test-index', 'source = test');
      expect(result.params.body.query.dataset).toEqual(
        buildPPLDataset('test-source', 'test-index')
      );
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

    const mockRequest = buildPPLQueryRequest('test-source', 'test-index', 'source = test');

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
      await pplService.executeQuery('test-source', 'test-index', 'source = test');
      expect(mockDataService.search.search).toHaveBeenCalled();
    });

    it('throws error with missing dataSourceId', async () => {
      await expect(pplService.executeQuery('', 'test-index', 'source = test')).rejects.toThrow(
        'Missing required parameters'
      );
    });

    it('throws error with missing indexPattern', async () => {
      await expect(pplService.executeQuery('test-source', '', 'source = test')).rejects.toThrow(
        'Missing required parameters'
      );
    });

    it('throws error with missing query', async () => {
      await expect(pplService.executeQuery('test-source', 'test-index', '')).rejects.toThrow(
        'Missing required parameters'
      );
    });

    it('handles search errors', async () => {
      const error = new Error('Search failed');
      (mockDataService.search.search as jest.Mock).mockReturnValue({
        toPromise: () => Promise.reject(error),
      });

      await expect(
        pplService.executeQuery('test-source', 'test-index', 'source = test')
      ).rejects.toThrow(error);
    });
  });
});
