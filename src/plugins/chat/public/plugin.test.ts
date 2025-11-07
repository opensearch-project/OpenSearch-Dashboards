/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChatPlugin } from './plugin';
import { ChatService } from './services/chat_service';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { BehaviorSubject } from 'rxjs';

// Mock dependencies
jest.mock('./services/chat_service');
jest.mock('../../opensearch_dashboards_react/public');

describe('ChatPlugin', () => {
  let plugin: ChatPlugin;
  let mockInitializerContext: any;
  let mockCoreSetup: any;
  let mockCoreStart: any;
  let mockDeps: any;
  let mockCurrentAppId$: BehaviorSubject<string | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock initializer context
    mockInitializerContext = {
      config: {
        get: jest.fn().mockReturnValue({ enabled: true, agUiUrl: 'http://test-ag-ui:3000' }),
      },
    };

    // Mock core setup
    mockCoreSetup = {};

    // Mock core start - start with non-explore app
    mockCurrentAppId$ = new BehaviorSubject<string | undefined>('dashboard');
    mockCoreStart = {
      application: {
        currentAppId$: mockCurrentAppId$,
      },
      chrome: {
        navControls: {
          registerPrimaryHeaderRight: jest.fn(),
        },
        globalSearch: {
          registerSearchCommand: jest.fn(),
        },
      },
    };

    // Mock dependencies
    mockDeps = {
      navigation: {} as any,
      contextProvider: {} as any,
      charts: {} as any,
    };

    // Mock toMountPoint
    (toMountPoint as jest.Mock).mockReturnValue(jest.fn().mockReturnValue(jest.fn()));

    plugin = new ChatPlugin(mockInitializerContext);
  });

  describe('setup', () => {
    it('should return valid setup contract', () => {
      const setupContract = plugin.setup(mockCoreSetup);

      expect(setupContract).toEqual({
        suggestedActionsService: expect.objectContaining({
          getCustomSuggestions: expect.any(Function),
          registerProvider: expect.any(Function),
          unregisterProvider: expect.any(Function),
        }),
      });
    });
  });

  describe('start', () => {
    it('should initialize chat service with configured AG-UI URL', () => {
      plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).toHaveBeenCalledWith('http://test-ag-ui:3000');
    });

    it('should register chat button in header nav controls', () => {
      plugin.start(mockCoreStart, mockDeps);

      expect(mockCoreStart.chrome.navControls.registerPrimaryHeaderRight).toHaveBeenCalledWith({
        order: 1000,
        mount: expect.any(Function),
      });
    });

    it('should return chat service in start contract', () => {
      const startContract = plugin.start(mockCoreStart, mockDeps);

      expect(startContract).toHaveProperty('chatService');
      expect(startContract.chatService).toBeInstanceOf(ChatService);
    });

    it('should handle missing AG-UI URL configuration', () => {
      mockInitializerContext.config.get = jest.fn().mockReturnValue({ enabled: true });

      const startContract = plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).not.toHaveBeenCalled();
      expect(startContract.chatService).toBeUndefined();
      expect(mockCoreStart.chrome.navControls.registerPrimaryHeaderRight).not.toHaveBeenCalled();
    });

    it('should not initialize when plugin is disabled', () => {
      mockInitializerContext.config.get = jest.fn().mockReturnValue({
        enabled: false,
        agUiUrl: 'http://test-ag-ui:3000',
      });

      const startContract = plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).not.toHaveBeenCalled();
      expect(startContract.chatService).toBeUndefined();
      expect(mockCoreStart.chrome.navControls.registerPrimaryHeaderRight).not.toHaveBeenCalled();
    });

    it('should not initialize when enabled is missing (defaults to false)', () => {
      mockInitializerContext.config.get = jest.fn().mockReturnValue({
        agUiUrl: 'http://test-ag-ui:3000',
      });

      const startContract = plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).not.toHaveBeenCalled();
      expect(startContract.chatService).toBeUndefined();
      expect(mockCoreStart.chrome.navControls.registerPrimaryHeaderRight).not.toHaveBeenCalled();
    });
  });

  describe('header button visibility', () => {
    let mountFunction: Function;

    beforeEach(() => {
      plugin.start(mockCoreStart, mockDeps);

      // Get the mount function that was registered
      const registerCall = (mockCoreStart.chrome.navControls
        .registerPrimaryHeaderRight as jest.Mock).mock.calls[0];
      mountFunction = registerCall[0].mount;
    });

    it('should show chat button', () => {
      const mockElement = document.createElement('div');
      const mockUnmount = jest.fn();
      (toMountPoint as jest.Mock).mockReturnValue(jest.fn().mockReturnValue(mockUnmount));

      const cleanup = mountFunction(mockElement);

      // Simulate app change to explore
      mockCurrentAppId$.next('explore-logs');

      expect(toMountPoint).toHaveBeenCalled();

      // Cleanup
      cleanup();
    });
  });

  describe('stop', () => {
    it('should not throw when called', () => {
      expect(() => plugin.stop()).not.toThrow();
    });
  });

  describe('configuration handling', () => {
    it('should handle different configuration formats', () => {
      const configs = [
        { enabled: true, agUiUrl: 'http://localhost:3000' },
        { enabled: true, agUiUrl: 'https://remote-server:8080' },
        { enabled: false, agUiUrl: 'http://localhost:3000' },
        { enabled: true }, // Missing agUiUrl
        {}, // Missing both enabled and agUiUrl
      ];

      configs.forEach((config) => {
        mockInitializerContext.config.get = jest.fn().mockReturnValue(config);
        const testPlugin = new ChatPlugin(mockInitializerContext);

        expect(() => testPlugin.start(mockCoreStart, mockDeps)).not.toThrow();

        // Only first two configs should initialize the service
        if (config.enabled && config.agUiUrl) {
          expect(ChatService).toHaveBeenCalledWith(config.agUiUrl);
        }
      });
    });
  });

  describe('integration', () => {
    it('should pass correct props to ChatHeaderButton', () => {
      plugin.start(mockCoreStart, mockDeps);

      const registerCall = (mockCoreStart.chrome.navControls
        .registerPrimaryHeaderRight as jest.Mock).mock.calls[0];
      const mountFunction = registerCall[0].mount;
      const mockElement = document.createElement('div');

      mountFunction(mockElement);

      // Trigger visibility by setting explore app
      mockCurrentAppId$.next('explore-test');

      expect(toMountPoint).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            core: mockCoreStart,
            chatService: expect.any(ChatService),
            contextProvider: mockDeps.contextProvider,
            charts: mockDeps.charts,
          }),
        })
      );
    });
  });

  describe('global search integration', () => {
    beforeEach(() => {
      mockCoreStart.chrome.globalSearch = {
        registerSearchCommand: jest.fn(),
      };
    });

    it('should register chat command with global search', () => {
      plugin.start(mockCoreStart, mockDeps);

      expect(mockCoreStart.chrome.globalSearch.registerSearchCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'AI_CHATBOT_COMMAND',
          type: 'ACTIONS',
          inputPlaceholder: expect.any(String),
          run: expect.any(Function),
          action: expect.any(Function),
        })
      );
    });

    it('should call startNewConversation when global search action is triggered', async () => {
      const mockStartNewConversation = jest.fn().mockResolvedValue(undefined);

      // Mock React.createRef to return a ref with our mock function
      const mockRef = {
        current: {
          startNewConversation: mockStartNewConversation,
        },
      };
      jest.spyOn(React, 'createRef').mockReturnValue(mockRef as any);

      plugin.start(mockCoreStart, mockDeps);

      const registerCall = (mockCoreStart.chrome.globalSearch.registerSearchCommand as jest.Mock)
        .mock.calls[0];
      const commandConfig = registerCall[0];

      // Trigger the action
      await commandConfig.action({ content: 'test query' });

      expect(mockStartNewConversation).toHaveBeenCalledWith({ content: 'test query' });
    });
  });
});
