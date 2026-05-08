/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpResponsePayload,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from 'src/core/server';
import { BaseConnectionManager, QueryExecutor } from './base_connection_manager';
import { BaseConnectionClient } from '../clients/base_connection_client';

// Concrete implementation of BaseConnectionManager for testing
class TestConnectionManager extends BaseConnectionManager<unknown, { query: string }, string> {
  handlePostRequest(
    _context: RequestHandlerContext,
    _request: OpenSearchDashboardsRequest
  ): Promise<HttpResponsePayload> {
    throw new Error('Not implemented');
  }
}

describe('BaseConnectionManager', () => {
  let manager: TestConnectionManager;
  let mockContext: RequestHandlerContext;
  let mockRequest: OpenSearchDashboardsRequest;

  beforeEach(() => {
    manager = new TestConnectionManager();
    mockContext = ({} as unknown) as RequestHandlerContext;
    mockRequest = ({} as unknown) as OpenSearchDashboardsRequest;
  });

  describe('query', () => {
    it('should return data when query executor succeeds', async () => {
      const mockExecutor: QueryExecutor<{ query: string }, string> = {
        execute: jest.fn().mockResolvedValue('query result'),
      };
      manager.setQueryExecutor(mockExecutor);

      const result = await manager.query(mockContext, mockRequest, { query: 'test' });

      expect(mockExecutor.execute).toHaveBeenCalledWith(mockContext, mockRequest, {
        query: 'test',
      });
      expect(result).toEqual('query result');
    });

    it('should propagate errors when query executor throws', async () => {
      const mockExecutor: QueryExecutor<{ query: string }, string> = {
        execute: jest.fn().mockRejectedValue(new Error('Query failed')),
      };
      manager.setQueryExecutor(mockExecutor);

      await expect(manager.query(mockContext, mockRequest, { query: 'test' })).rejects.toThrow(
        'Query failed'
      );
    });

    it('should throw error when no query executor is set', async () => {
      await expect(manager.query(mockContext, mockRequest, { query: 'test' })).rejects.toThrow(
        'No query executor available'
      );
    });
  });

  describe('getClient', () => {
    it('should return client from factory', () => {
      const mockClient = ({
        getResources: jest.fn(),
      } as unknown) as BaseConnectionClient<unknown>;
      const clientFactory = jest.fn().mockReturnValue(mockClient);

      manager.setClientFactory(clientFactory);
      const client = (manager as any).getClient(mockContext, mockRequest);

      expect(clientFactory).toHaveBeenCalledWith(mockContext, mockRequest);
      expect(client).toBe(mockClient);
    });

    it('should throw error when no client factory is set', () => {
      expect(() => (manager as any).getClient(mockContext, mockRequest)).toThrow(
        'Client factory not set'
      );
    });
  });

  describe('setQueryExecutor', () => {
    it('should allow query executor to be set and retrieved', async () => {
      const mockExecutor: QueryExecutor<{ query: string }, string> = {
        execute: jest.fn().mockResolvedValue('result'),
      };

      manager.setQueryExecutor(mockExecutor);

      const retrievedExecutor = (manager as any).getQueryExecutor();
      expect(retrievedExecutor).toBe(mockExecutor);
    });
  });
});
