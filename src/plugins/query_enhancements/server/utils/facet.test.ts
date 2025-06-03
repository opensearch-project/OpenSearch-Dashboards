/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { Facet, FacetProps } from './facet';

describe('Facet', () => {
  let facet: Facet;
  let facetWithShimEnabled: Facet;
  let mockClient: jest.Mock;
  let mockLogger: jest.Mocked<Logger>;
  let mockContext: any;
  let mockRequest: any;

  beforeEach(() => {
    mockClient = jest.fn();
    mockLogger = ({
      error: jest.fn(),
    } as unknown) as jest.Mocked<Logger>;

    const props: FacetProps = {
      client: { asScoped: jest.fn().mockReturnValue({ callAsCurrentUser: mockClient }) },
      logger: mockLogger,
      endpoint: 'test-endpoint',
    };

    facet = new Facet(props);
    facetWithShimEnabled = new Facet({ ...props, shimResponse: true });

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
});
