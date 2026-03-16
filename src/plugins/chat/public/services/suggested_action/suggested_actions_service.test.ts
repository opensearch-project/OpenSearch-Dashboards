/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SuggestedActionsService } from './suggested_actions_service';
import { SuggestedActionsProvider, ChatContext, SuggestedActions } from './types';
import { SuggestedActionsRegistry } from './suggested_actions_registry';

jest.mock('./suggested_actions_registry');

describe('SuggestedActionsService', () => {
  let service: SuggestedActionsService;
  let mockRegistry: jest.Mocked<SuggestedActionsRegistry>;

  const mockProvider: SuggestedActionsProvider = {
    id: 'test-provider',
    priority: 10,
    getSuggestions: jest.fn().mockResolvedValue([]),
    isEnabled: jest.fn().mockReturnValue(true),
  };

  const mockChatContext: ChatContext = {
    conversationId: 'test-conversation',
    messageHistory: [],
    dataSourceId: 'test-datasource',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SuggestedActionsService();
    mockRegistry = (service as any).registry as jest.Mocked<SuggestedActionsRegistry>;
  });

  describe('registerProvider', () => {
    test('should successfully register a valid provider', () => {
      mockRegistry.register = jest.fn();

      service.registerProvider(mockProvider);

      expect(mockRegistry.register).toHaveBeenCalledWith(mockProvider);
      expect(mockRegistry.register).toHaveBeenCalledTimes(1);
    });

    test('should throw error when provider is null or undefined', () => {
      expect(() => service.registerProvider(null as any)).toThrow(
        'Provider cannot be null or undefined'
      );
      expect(() => service.registerProvider(undefined as any)).toThrow(
        'Provider cannot be null or undefined'
      );
    });

    test('should throw error when provider is not an object', () => {
      expect(() => service.registerProvider('invalid-provider' as any)).toThrow(
        'Provider must be an object'
      );
      expect(() => service.registerProvider(123 as any)).toThrow('Provider must be an object');
    });

    test('should re-throw registry errors with additional context', () => {
      const registryError = new Error('Registry validation failed');
      mockRegistry.register = jest.fn().mockImplementation(() => {
        throw registryError;
      });

      expect(() => service.registerProvider(mockProvider)).toThrow(
        'Failed to register suggestion provider: Registry validation failed'
      );
    });
  });

  describe('getCustomSuggestions', () => {
    test('should return suggestions from registry for valid context', async () => {
      const mockSuggestions: SuggestedActions[] = [
        {
          actionType: 'navigate',
          message: 'View dashboard',
          action: jest.fn().mockResolvedValue(true),
        },
      ];

      mockRegistry.getCustomSuggestions = jest.fn().mockResolvedValue(mockSuggestions);

      const result = await service.getCustomSuggestions(mockChatContext);

      expect(result).toEqual(mockSuggestions);
      expect(mockRegistry.getCustomSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'test-conversation',
          messageHistory: [],
          dataSourceId: 'test-datasource',
        })
      );
    });

    test('should throw error when context is null or undefined', async () => {
      await expect(service.getCustomSuggestions(null as any)).rejects.toThrow(
        'Chat context is required'
      );
      await expect(service.getCustomSuggestions(undefined as any)).rejects.toThrow(
        'Chat context is required'
      );
    });

    test('should throw error when messageHistory is not an array', async () => {
      const invalidContext = {
        conversationId: 'test',
        messageHistory: 'invalid' as any,
      };

      await expect(service.getCustomSuggestions(invalidContext)).rejects.toThrow(
        'Chat context must include messageHistory array'
      );
    });

    test('should return empty array when registry throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRegistry.getCustomSuggestions = jest.fn().mockRejectedValue(new Error('Registry error'));

      const result = await service.getCustomSuggestions(mockChatContext);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error retrieving custom suggestions:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('lifecycle methods', () => {
    test('should return setup contract with bound methods', () => {
      const setupContract = service.setup();

      expect(setupContract).toHaveProperty('registerProvider');
      expect(setupContract).toHaveProperty('unregisterProvider');
      expect(setupContract).toHaveProperty('getCustomSuggestions');
      expect(typeof setupContract.registerProvider).toBe('function');
      expect(typeof setupContract.unregisterProvider).toBe('function');
      expect(typeof setupContract.getCustomSuggestions).toBe('function');
    });

    test('should return start contract with bound methods', () => {
      const startContract = service.start();

      expect(startContract).toHaveProperty('registerProvider');
      expect(startContract).toHaveProperty('unregisterProvider');
      expect(startContract).toHaveProperty('getCustomSuggestions');
      expect(typeof startContract.registerProvider).toBe('function');
      expect(typeof startContract.unregisterProvider).toBe('function');
      expect(typeof startContract.getCustomSuggestions).toBe('function');
    });

    test('should clear registry when stop is called', () => {
      mockRegistry.clear = jest.fn();

      service.stop();

      expect(mockRegistry.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterProvider', () => {
    test('should successfully unregister a provider by ID', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRegistry.unregister = jest.fn().mockReturnValue(true);

      service.unregisterProvider('test-provider');

      expect(mockRegistry.unregister).toHaveBeenCalledWith('test-provider');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    test('should log warning when provider ID is not found', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockRegistry.unregister = jest.fn().mockReturnValue(false);

      service.unregisterProvider('non-existent-provider');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Provider with ID 'non-existent-provider' was not found for unregistration"
      );

      consoleWarnSpy.mockRestore();
    });

    test('should throw error when provider ID is invalid', () => {
      expect(() => service.unregisterProvider('')).toThrow(
        'Provider ID must be a non-empty string'
      );
      expect(() => service.unregisterProvider(null as any)).toThrow(
        'Provider ID must be a non-empty string'
      );
      expect(() => service.unregisterProvider(123 as any)).toThrow(
        'Provider ID must be a non-empty string'
      );
    });
  });

  describe('utility methods', () => {
    test('buildChatContext should create complete context object', () => {
      const message = {
        id: 'msg-1',
        content: 'test message',
        role: 'user' as const,
      };
      const messageHistory = [{ id: 'msg-0', content: 'previous', role: 'assistant' as const }];

      const context = service.buildChatContext('conv-123', message, messageHistory, 'datasource-1');

      expect(context).toEqual({
        conversationId: 'conv-123',
        currentMessage: message,
        messageHistory,
        dataSourceId: 'datasource-1',
      });
    });

    test('buildChatContext should handle optional parameters', () => {
      const context = service.buildChatContext();

      expect(context).toEqual({
        conversationId: undefined,
        currentMessage: undefined,
        messageHistory: [],
        dataSourceId: undefined,
      });
    });

    test('getProviderCount should delegate to registry', () => {
      mockRegistry.getProviderCount = jest.fn().mockReturnValue(3);

      const count = service.getProviderCount();

      expect(count).toBe(3);
      expect(mockRegistry.getProviderCount).toHaveBeenCalledTimes(1);
    });

    test('getProviderIds should delegate to registry', () => {
      const mockIds = ['provider-1', 'provider-2', 'provider-3'];
      mockRegistry.getProviderIds = jest.fn().mockReturnValue(mockIds);

      const ids = service.getProviderIds();

      expect(ids).toEqual(mockIds);
      expect(mockRegistry.getProviderIds).toHaveBeenCalledTimes(1);
    });
  });
});
