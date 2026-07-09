/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import { ResourceClientFactory, ResourceClientCreator } from './resource_client_factory';
import { BaseResourceClient } from './base_resource_client';

describe('ResourceClientFactory', () => {
  let mockHttp: jest.Mocked<HttpSetup>;
  let factory: ResourceClientFactory;

  beforeEach(() => {
    mockHttp = {} as jest.Mocked<HttpSetup>;
    factory = new ResourceClientFactory(mockHttp);
  });

  describe('register', () => {
    it('should register a resource client creator', () => {
      const mockClient = {} as BaseResourceClient;
      const mockCreator: ResourceClientCreator = jest.fn().mockReturnValue(mockClient);

      factory.register('test-type', mockCreator);

      const client = factory.get('test-type');
      expect(mockCreator).toHaveBeenCalledWith(mockHttp);
      expect(client).toBe(mockClient);
    });

    it('should allow registering multiple client creators', () => {
      const mockClient1 = ({ id: 1 } as unknown) as BaseResourceClient;
      const mockClient2 = ({ id: 2 } as unknown) as BaseResourceClient;
      const mockCreator1: ResourceClientCreator = jest.fn().mockReturnValue(mockClient1);
      const mockCreator2: ResourceClientCreator = jest.fn().mockReturnValue(mockClient2);

      factory.register('type-1', mockCreator1);
      factory.register('type-2', mockCreator2);

      expect(factory.get('type-1')).toBe(mockClient1);
      expect(factory.get('type-2')).toBe(mockClient2);
    });
  });

  describe('get', () => {
    it('should throw error for unregistered connection type', () => {
      expect(() => factory.get('unregistered-type')).toThrow(
        'Connection type unsupported: unregistered-type'
      );
    });

    it('should cache and return the same client instance', () => {
      const mockClient = {} as BaseResourceClient;
      const mockCreator: ResourceClientCreator = jest.fn().mockReturnValue(mockClient);

      factory.register('cached-type', mockCreator);

      const client1 = factory.get('cached-type');
      const client2 = factory.get('cached-type');

      expect(mockCreator).toHaveBeenCalledTimes(1);
      expect(client1).toBe(client2);
    });

    it('should create new clients for different connection types', () => {
      const mockClient1 = ({ id: 1 } as unknown) as BaseResourceClient;
      const mockClient2 = ({ id: 2 } as unknown) as BaseResourceClient;
      const mockCreator1: ResourceClientCreator = jest.fn().mockReturnValue(mockClient1);
      const mockCreator2: ResourceClientCreator = jest.fn().mockReturnValue(mockClient2);

      factory.register('type-a', mockCreator1);
      factory.register('type-b', mockCreator2);

      const clientA = factory.get('type-a');
      const clientB = factory.get('type-b');

      expect(mockCreator1).toHaveBeenCalledTimes(1);
      expect(mockCreator2).toHaveBeenCalledTimes(1);
      expect(clientA).not.toBe(clientB);
    });
  });
});
