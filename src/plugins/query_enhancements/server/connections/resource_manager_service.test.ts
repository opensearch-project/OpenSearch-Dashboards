/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resourceManagerService } from './resource_manager_service';
import { BaseConnectionManager } from './managers/base_connection_manager';

describe('ResourceManagerService', () => {
  let mockManager: jest.Mocked<BaseConnectionManager>;

  beforeEach(() => {
    mockManager = {} as jest.Mocked<BaseConnectionManager>;
  });

  const DATA_CONNECTION_TYPE = 'test-connection';
  describe('register', () => {
    it('should successfully register a new manager', () => {
      resourceManagerService.register(DATA_CONNECTION_TYPE, mockManager);
      expect(resourceManagerService.getManager(DATA_CONNECTION_TYPE)).toBe(mockManager);
    });

    it('should throw error when registering duplicate connection type', () => {
      expect(() => {
        resourceManagerService.register(DATA_CONNECTION_TYPE, mockManager);
      }).toThrow(
        `Manager for dataConnectionType ${DATA_CONNECTION_TYPE} is already registered. Unable to register another manager.`
      );
    });
  });

  describe('getManager', () => {
    it('should return correct manager for registered connection type', () => {
      const result = resourceManagerService.getManager(DATA_CONNECTION_TYPE);
      expect(result).toBeDefined();
    });

    it('should return undefined for non-existent connection type', () => {
      const nonExistentType = 'non-existent';
      const result = resourceManagerService.getManager(nonExistentType);
      expect(result).toBeUndefined();
    });
  });
});
