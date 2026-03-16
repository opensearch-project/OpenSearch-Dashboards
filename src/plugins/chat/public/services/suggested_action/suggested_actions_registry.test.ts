/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SuggestedActionsRegistry } from './suggested_actions_registry';
import { SuggestedActionsProvider, ChatContext } from './types';

describe('SuggestedActionsRegistry', () => {
  let registry: SuggestedActionsRegistry;

  const mockChatContext: ChatContext = {
    conversationId: 'test-conversation',
    messageHistory: [{ id: 'msg-1', content: 'Hello', role: 'user' }],
    dataSourceId: 'test-datasource',
  };

  const createMockProvider = (
    id: string,
    priority?: number,
    isEnabled?: () => boolean
  ): SuggestedActionsProvider => ({
    id,
    priority,
    getSuggestions: jest.fn().mockResolvedValue([
      {
        actionType: 'test',
        message: `Suggestion from ${id}`,
        action: jest.fn().mockResolvedValue(true),
      },
    ]),
    isEnabled,
  });

  beforeEach(() => {
    registry = new SuggestedActionsRegistry();
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should successfully register a valid provider', () => {
      const provider = createMockProvider('test-provider');

      expect(() => registry.register(provider)).not.toThrow();
      expect(registry.hasProvider('test-provider')).toBe(true);
      expect(registry.getProviderCount()).toBe(1);
    });

    test('should throw error when provider is null or has invalid fields', () => {
      expect(() => registry.register(null as any)).toThrow('Provider cannot be null or undefined');
      expect(() => registry.register({ id: '', getSuggestions: jest.fn() } as any)).toThrow(
        'Provider must have a valid id'
      );
      expect(() => registry.register({ id: 'test' } as any)).toThrow(
        'Provider must have a getSuggestions method'
      );
    });

    test('should throw error when provider is already registered', () => {
      const provider = createMockProvider('test-provider');
      registry.register(provider);

      expect(() => registry.register(provider)).toThrow(
        "Provider with id 'test-provider' is already registered"
      );
    });
  });

  describe('unregister', () => {
    test('should successfully unregister an existing provider', () => {
      const provider = createMockProvider('test-provider');
      registry.register(provider);

      const result = registry.unregister('test-provider');

      expect(result).toBe(true);
      expect(registry.hasProvider('test-provider')).toBe(false);
      expect(registry.getProviderCount()).toBe(0);
    });

    test('should return false when provider does not exist', () => {
      expect(registry.unregister('non-existent-provider')).toBe(false);
      expect(registry.unregister(null as any)).toBe(false);
      expect(registry.unregister('')).toBe(false);
    });
  });

  describe('getCustomSuggestions', () => {
    test('should return empty array when no providers are registered', async () => {
      const result = await registry.getCustomSuggestions(mockChatContext);
      expect(result).toEqual([]);
    });

    test('should return suggestions from a single enabled provider', async () => {
      const provider = createMockProvider('test-provider');
      registry.register(provider);

      const result = await registry.getCustomSuggestions(mockChatContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          actionType: 'test',
          message: 'Suggestion from test-provider',
          providerId: 'test-provider',
        })
      );
      expect(provider.getSuggestions).toHaveBeenCalledWith(mockChatContext);
    });

    test('should sort suggestions by priority (higher first) and skip disabled providers', async () => {
      const lowPriorityProvider = createMockProvider('low-priority', 1);
      const highPriorityProvider = createMockProvider('high-priority', 10);
      const disabledProvider = createMockProvider('disabled-provider', 5, () => false);

      registry.register(lowPriorityProvider);
      registry.register(highPriorityProvider);
      registry.register(disabledProvider);

      const result = await registry.getCustomSuggestions(mockChatContext);

      expect(result).toHaveLength(2);
      expect((result[0] as any).providerId).toBe('high-priority');
      expect((result[1] as any).providerId).toBe('low-priority');
      expect(disabledProvider.getSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('getProviderCount', () => {
    test('should return 0 when no providers are registered', () => {
      expect(registry.getProviderCount()).toBe(0);
    });

    test('should return correct count when providers are registered', () => {
      registry.register(createMockProvider('provider-1'));
      expect(registry.getProviderCount()).toBe(1);

      registry.register(createMockProvider('provider-2'));
      expect(registry.getProviderCount()).toBe(2);
    });
  });

  describe('getProviderIds', () => {
    test('should return empty array when no providers are registered', () => {
      expect(registry.getProviderIds()).toEqual([]);
    });

    test('should return array of registered provider IDs', () => {
      registry.register(createMockProvider('provider-1'));
      registry.register(createMockProvider('provider-2'));

      const ids = registry.getProviderIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('provider-1');
      expect(ids).toContain('provider-2');
    });
  });

  describe('hasProvider', () => {
    test('should return false when provider is not registered', () => {
      expect(registry.hasProvider('non-existent')).toBe(false);
    });

    test('should return true when provider is registered', () => {
      registry.register(createMockProvider('test-provider'));
      expect(registry.hasProvider('test-provider')).toBe(true);
    });
  });

  describe('clear', () => {
    test('should remove all registered providers', () => {
      registry.register(createMockProvider('provider-1'));
      registry.register(createMockProvider('provider-2'));
      expect(registry.getProviderCount()).toBe(2);

      registry.clear();

      expect(registry.getProviderCount()).toBe(0);
      expect(registry.getProviderIds()).toEqual([]);
    });

    test('should do nothing when no providers are registered', () => {
      expect(() => registry.clear()).not.toThrow();
      expect(registry.getProviderCount()).toBe(0);
    });
  });
});
