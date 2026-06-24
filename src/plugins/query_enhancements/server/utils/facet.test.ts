/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { Facet, FacetProps } from './facet';

describe('Facet', () => {
  let facet: Facet;
  let facetWithShimEnabled: Facet;
  let facetWithCompression: Facet;
  let mockClient: jest.Mock;
  let mockLogger: jest.Mocked<Logger>;
  let mockContext: any;
  let mockRequest: any;

  beforeEach(() => {
    mockClient = jest.fn();
    mockLogger = ({
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown) as jest.Mocked<Logger>;

    const props: FacetProps = {
      client: { asScoped: jest.fn().mockReturnValue({ callAsCurrentUser: mockClient }) },
      logger: mockLogger,
      endpoint: 'test-endpoint',
    };

    facet = new Facet(props);
    facetWithShimEnabled = new Facet({ ...props, shimResponse: true });
    facetWithCompression = new Facet({ ...props, requestCompression: true });

    mockContext = {
      dataSource: {
        opensearch: {
          legacy: {
            getClient: jest.fn().mockReturnValue({ callAPI: mockClient }),
          },
        },
      },
    };

    mockRequest = {
      body: {
        query: {
          query: 'test query',
          dataset: {
            dataSource: {
              id: 'test-id',
              meta: {
                name: 'test-name',
                sessionId: 'test-session',
              },
            },
          },
        },
        format: 'jdbc',
        lang: 'sql',
      },
    };
  });

  describe('describeQuery', () => {
    it('should handle request with complete dataset information', async () => {
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          datasource: 'test-name',
          sessionId: 'test-session',
          lang: 'sql',
        },
      });
    });

    it('should include fetch_size in params when fetchSize is provided', async () => {
      mockClient.mockResolvedValue({ result: 'success' });
      mockRequest.body.fetchSize = 500;

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          fetch_size: 500,
          datasource: 'test-name',
          sessionId: 'test-session',
          lang: 'sql',
        },
      });
    });

    it('should not include fetch_size when fetchSize is not provided', async () => {
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      const callArgs = mockClient.mock.calls[0][1];
      expect(callArgs.body.fetch_size).toBeUndefined();
    });

    it('should handle request with missing dataSource', async () => {
      mockRequest.body.query.dataset.dataSource = undefined;
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          lang: 'sql',
        },
      });
    });

    it('should handle request with missing dataset', async () => {
      mockRequest.body.query.dataset = undefined;
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          lang: 'sql',
        },
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockClient.mockRejectedValue(error);

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: false, data: error });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Facet fetch: test-endpoint: Error: Test error'
      );
    });

    it('should handle errors with shim enabled', async () => {
      const error = new Error('Test error');
      mockClient.mockRejectedValue(error);

      const result = await facetWithShimEnabled.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: false, data: error });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Facet fetch: test-endpoint: Error: Test error'
      );
    });
  });

  describe('requestCompression', () => {
    it('should add accept-encoding header when requestCompression is true', async () => {
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facetWithCompression.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          datasource: 'test-name',
          sessionId: 'test-session',
          lang: 'sql',
        },
        headers: { 'accept-encoding': 'gzip, deflate' },
      });
    });

    it('should NOT add accept-encoding header when requestCompression is false', async () => {
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facet.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        body: {
          query: 'test query',
          datasource: 'test-name',
          sessionId: 'test-session',
          lang: 'sql',
        },
      });
      // Verify headers are not present
      const callArgs = mockClient.mock.calls[0][1];
      expect(callArgs.headers).toBeUndefined();
    });

    it('should add accept-encoding header for fetchJobs when requestCompression is true', async () => {
      const facetWithCompressionAndJobs = new Facet({
        client: { asScoped: jest.fn().mockReturnValue({ callAsCurrentUser: mockClient }) },
        logger: mockLogger,
        endpoint: 'test-endpoint',
        useJobs: true,
        requestCompression: true,
      });

      mockRequest.params = { queryId: 'test-query-id' };
      mockClient.mockResolvedValue({ result: 'success' });

      const result = await facetWithCompressionAndJobs.describeQuery(mockContext, mockRequest);

      expect(result).toEqual({ success: true, data: { result: 'success' } });
      expect(mockClient).toHaveBeenCalledWith('test-endpoint', {
        queryId: 'test-query-id',
        headers: { 'accept-encoding': 'gzip, deflate' },
      });
    });
  });

  describe('legacy Elasticsearch Open Distro routing', () => {
    const buildProps = (endpoint: string, legacyEsCompatEnabled: boolean): FacetProps => ({
      client: { asScoped: jest.fn().mockReturnValue({ callAsCurrentUser: mockClient }) },
      logger: mockLogger,
      endpoint,
      legacyEsCompatEnabled,
    });

    beforeEach(() => {
      mockClient.mockResolvedValue({ result: 'success' });
    });

    it('routes PPL queries against Elasticsearch data sources to the Open Distro action when the flag is ON', async () => {
      const pplFacet = new Facet(buildProps('enhancements.pplQuery', true));
      mockRequest.body.query.dataset.dataSource.engineType = 'Elasticsearch';

      await pplFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.pplQueryOpenDistro');
    });

    it('routes SQL queries against Elasticsearch data sources to the Open Distro action when the flag is ON', async () => {
      const sqlFacet = new Facet(buildProps('enhancements.sqlQuery', true));
      mockRequest.body.query.dataset.dataSource.engineType = 'Elasticsearch';

      await sqlFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.sqlQueryOpenDistro');
    });

    it('does NOT remap Elasticsearch data sources when the flag is OFF', async () => {
      const pplFacet = new Facet(buildProps('enhancements.pplQuery', false));
      mockRequest.body.query.dataset.dataSource.engineType = 'Elasticsearch';

      await pplFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.pplQuery');
    });

    it('does NOT remap non-Elasticsearch (OpenSearch) data sources when the flag is ON', async () => {
      const pplFacet = new Facet(buildProps('enhancements.pplQuery', true));
      mockRequest.body.query.dataset.dataSource.engineType = 'OpenSearch';

      await pplFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.pplQuery');
    });

    it('fails open and keeps the original endpoint when dataSource is undefined and the flag is ON', async () => {
      const pplFacet = new Facet(buildProps('enhancements.pplQuery', true));
      mockRequest.body.query.dataset.dataSource = undefined;

      await pplFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.pplQuery');
    });

    it('falls back to dataSource.type when engineType is absent and remaps Elasticsearch sources when the flag is ON', async () => {
      const pplFacet = new Facet(buildProps('enhancements.pplQuery', true));
      delete mockRequest.body.query.dataset.dataSource.engineType;
      mockRequest.body.query.dataset.dataSource.type = 'Elasticsearch';

      await pplFacet.describeQuery(mockContext, mockRequest);

      expect(mockClient.mock.calls[0][0]).toBe('enhancements.pplQueryOpenDistro');
    });
  });
});
