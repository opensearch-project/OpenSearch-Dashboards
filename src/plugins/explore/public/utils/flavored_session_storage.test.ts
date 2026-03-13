/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlavoredSessionStorage } from './flavored_session_storage';

describe('FlavoredSessionStorage', () => {
  let mockStorage: Storage;
  let flavoredStorage: FlavoredSessionStorage;

  beforeEach(() => {
    // Create a mock storage implementation
    const store: Record<string, string> = {};
    mockStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
      key: jest.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      }),
      get length() {
        return Object.keys(store).length;
      },
    };

    flavoredStorage = new FlavoredSessionStorage('logs', mockStorage);
  });

  describe('constructor', () => {
    it('should create instance with flavor prefix', () => {
      expect(flavoredStorage).toBeDefined();
    });

    it('should use window.sessionStorage by default if no storage provided', () => {
      const defaultStorage = new FlavoredSessionStorage('traces');
      expect(defaultStorage).toBeDefined();
    });
  });

  describe('setItem', () => {
    it('should prefix keys with flavor', () => {
      flavoredStorage.setItem('testKey', 'testValue');
      expect(mockStorage.setItem).toHaveBeenCalledWith('logs:testKey', 'testValue');
    });

    it('should store multiple items with different keys', () => {
      flavoredStorage.setItem('key1', 'value1');
      flavoredStorage.setItem('key2', 'value2');

      expect(mockStorage.setItem).toHaveBeenCalledWith('logs:key1', 'value1');
      expect(mockStorage.setItem).toHaveBeenCalledWith('logs:key2', 'value2');
    });

    it('should handle empty string values', () => {
      flavoredStorage.setItem('emptyKey', '');
      expect(mockStorage.setItem).toHaveBeenCalledWith('logs:emptyKey', '');
    });
  });

  describe('getItem', () => {
    it('should retrieve item with prefixed key', () => {
      flavoredStorage.setItem('testKey', 'testValue');
      const result = flavoredStorage.getItem('testKey');

      expect(mockStorage.getItem).toHaveBeenCalledWith('logs:testKey');
      expect(result).toBe('testValue');
    });

    it('should return null for non-existent keys', () => {
      const result = flavoredStorage.getItem('nonExistentKey');
      expect(result).toBeNull();
    });

    it('should retrieve correct value after multiple sets', () => {
      flavoredStorage.setItem('key1', 'value1');
      flavoredStorage.setItem('key1', 'value2');
      const result = flavoredStorage.getItem('key1');

      expect(result).toBe('value2');
    });
  });

  describe('removeItem', () => {
    it('should remove item with prefixed key', () => {
      flavoredStorage.setItem('testKey', 'testValue');
      flavoredStorage.removeItem('testKey');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('logs:testKey');
      expect(flavoredStorage.getItem('testKey')).toBeNull();
    });

    it('should not affect other flavors keys', () => {
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      flavoredStorage.setItem('key1', 'logsValue');
      tracesStorage.setItem('key1', 'tracesValue');

      flavoredStorage.removeItem('key1');

      expect(flavoredStorage.getItem('key1')).toBeNull();
      expect(tracesStorage.getItem('key1')).toBe('tracesValue');
    });
  });

  describe('clear', () => {
    it('should only clear items with matching flavor prefix', () => {
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      flavoredStorage.setItem('key1', 'logsValue1');
      flavoredStorage.setItem('key2', 'logsValue2');
      tracesStorage.setItem('key1', 'tracesValue1');
      tracesStorage.setItem('key2', 'tracesValue2');

      flavoredStorage.clear();

      expect(flavoredStorage.getItem('key1')).toBeNull();
      expect(flavoredStorage.getItem('key2')).toBeNull();
      expect(tracesStorage.getItem('key1')).toBe('tracesValue1');
      expect(tracesStorage.getItem('key2')).toBe('tracesValue2');
    });

    it('should handle empty storage', () => {
      expect(() => flavoredStorage.clear()).not.toThrow();
    });

    it('should clear all items for a flavor', () => {
      flavoredStorage.setItem('key1', 'value1');
      flavoredStorage.setItem('key2', 'value2');
      flavoredStorage.setItem('key3', 'value3');

      flavoredStorage.clear();

      expect(flavoredStorage.length).toBe(0);
    });
  });

  describe('key', () => {
    it('should return unprefixed key at given index', () => {
      flavoredStorage.setItem('key1', 'value1');
      flavoredStorage.setItem('key2', 'value2');

      const key = flavoredStorage.key(0);
      expect(key).toMatch(/^key[12]$/);
    });

    it('should return null for out of bounds index', () => {
      flavoredStorage.setItem('key1', 'value1');

      expect(flavoredStorage.key(5)).toBeNull();
    });

    it('should only return keys for matching flavor', () => {
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      flavoredStorage.setItem('logsKey', 'logsValue');
      tracesStorage.setItem('tracesKey', 'tracesValue');

      const logsKey = flavoredStorage.key(0);
      expect(logsKey).toBe('logsKey');

      const tracesKey = tracesStorage.key(0);
      expect(tracesKey).toBe('tracesKey');
    });

    it('should handle negative index', () => {
      flavoredStorage.setItem('key1', 'value1');
      const result = flavoredStorage.key(-1);
      expect(result === null || result === undefined).toBe(true);
    });
  });

  describe('length', () => {
    it('should return 0 for empty storage', () => {
      expect(flavoredStorage.length).toBe(0);
    });

    it('should return correct count for flavor-specific items', () => {
      flavoredStorage.setItem('key1', 'value1');
      flavoredStorage.setItem('key2', 'value2');

      expect(flavoredStorage.length).toBe(2);
    });

    it('should only count items with matching flavor prefix', () => {
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      flavoredStorage.setItem('key1', 'logsValue1');
      flavoredStorage.setItem('key2', 'logsValue2');
      tracesStorage.setItem('key1', 'tracesValue1');

      expect(flavoredStorage.length).toBe(2);
      expect(tracesStorage.length).toBe(1);
    });

    it('should update after adding and removing items', () => {
      flavoredStorage.setItem('key1', 'value1');
      expect(flavoredStorage.length).toBe(1);

      flavoredStorage.setItem('key2', 'value2');
      expect(flavoredStorage.length).toBe(2);

      flavoredStorage.removeItem('key1');
      expect(flavoredStorage.length).toBe(1);
    });
  });

  describe('flavor isolation', () => {
    it('should isolate storage between different flavors', () => {
      const logsStorage = new FlavoredSessionStorage('logs', mockStorage);
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);
      const metricsStorage = new FlavoredSessionStorage('metrics', mockStorage);

      logsStorage.setItem('dataset', 'logs-dataset');
      tracesStorage.setItem('dataset', 'traces-dataset');
      metricsStorage.setItem('dataset', 'metrics-dataset');

      expect(logsStorage.getItem('dataset')).toBe('logs-dataset');
      expect(tracesStorage.getItem('dataset')).toBe('traces-dataset');
      expect(metricsStorage.getItem('dataset')).toBe('metrics-dataset');
    });

    it('should not interfere with other flavors when clearing', () => {
      const logsStorage = new FlavoredSessionStorage('logs', mockStorage);
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      logsStorage.setItem('key1', 'logsValue');
      tracesStorage.setItem('key1', 'tracesValue');

      logsStorage.clear();

      expect(logsStorage.getItem('key1')).toBeNull();
      expect(tracesStorage.getItem('key1')).toBe('tracesValue');
      expect(logsStorage.length).toBe(0);
      expect(tracesStorage.length).toBe(1);
    });

    it('should handle same keys across multiple flavors', () => {
      const logsStorage = new FlavoredSessionStorage('logs', mockStorage);
      const tracesStorage = new FlavoredSessionStorage('traces', mockStorage);

      const sharedKeys = ['query', 'timeRange', 'filters'];

      sharedKeys.forEach((key, index) => {
        logsStorage.setItem(key, `logs-${index}`);
        tracesStorage.setItem(key, `traces-${index}`);
      });

      sharedKeys.forEach((key, index) => {
        expect(logsStorage.getItem(key)).toBe(`logs-${index}`);
        expect(tracesStorage.getItem(key)).toBe(`traces-${index}`);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle keys with special characters', () => {
      const specialKey = 'key:with:colons:and-dashes_and_underscores';
      flavoredStorage.setItem(specialKey, 'value');

      expect(flavoredStorage.getItem(specialKey)).toBe('value');
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      flavoredStorage.setItem(longKey, 'value');

      expect(flavoredStorage.getItem(longKey)).toBe('value');
    });

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(10000);
      flavoredStorage.setItem('key', longValue);

      expect(flavoredStorage.getItem('key')).toBe(longValue);
    });

    it('should handle unicode characters in keys and values', () => {
      flavoredStorage.setItem('🔑', '日本語');

      expect(flavoredStorage.getItem('🔑')).toBe('日本語');
    });

    it('should handle JSON stringified objects', () => {
      const obj = { nested: { data: 'value' }, array: [1, 2, 3] };
      const jsonString = JSON.stringify(obj);

      flavoredStorage.setItem('jsonKey', jsonString);
      const retrieved = flavoredStorage.getItem('jsonKey');

      expect(retrieved).toBe(jsonString);
      expect(JSON.parse(retrieved!)).toEqual(obj);
    });
  });
});
