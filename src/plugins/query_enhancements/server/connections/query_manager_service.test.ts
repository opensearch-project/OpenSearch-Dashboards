/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { queryManagerService } from './query_manager_service';
import { BaseConnectionManager } from './managers/base_connection_manager';

describe('QueryManagerService', () => {
  let mockManager: jest.Mocked<BaseConnectionManager>;

  beforeEach(() => {
    mockManager = {} as jest.Mocked<BaseConnectionManager>;
  });

  const DATA_CONNECTION_TYPE = 'test-query-connection';
  describe('register', () => {
    it('should successfully register a new manager', () => {
      queryManagerService.register(DATA_CONNECTION_TYPE, mockManager);
      expect(queryManagerService.getManager(DATA_CONNECTION_TYPE)).toBe(mockManager);
    });

    it('should allow idempotent registration of the same manager', () => {
      const existingManager = queryManagerService.getManager(DATA_CONNECTION_TYPE);
      expect(() => {
        queryManagerService.register(DATA_CONNECTION_TYPE, existingManager!);
      }).not.toThrow();
      expect(queryManagerService.getManager(DATA_CONNECTION_TYPE)).toBe(existingManager);
    });

    it('should throw error when registering a different manager for same connection type', () => {
      const differentManager = {} as jest.Mocked<BaseConnectionManager>;
      expect(() => {
        queryManagerService.register(DATA_CONNECTION_TYPE, differentManager);
      }).toThrow(
        `Query manager for dataConnectionType ${DATA_CONNECTION_TYPE} is already registered. Unable to register another manager.`
      );
    });
  });

  describe('getManager', () => {
    it('should return correct manager for registered connection type', () => {
      const result = queryManagerService.getManager(DATA_CONNECTION_TYPE);
      expect(result).toBeDefined();
    });

    it('should return undefined for non-existent connection type', () => {
      const nonExistentType = 'non-existent';
      const result = queryManagerService.getManager(nonExistentType);
      expect(result).toBeUndefined();
    });
  });
});
