/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChatPlugin } from './plugin';
import { ChatService } from './services/chat_service';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { BehaviorSubject, of } from 'rxjs';

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
      overlays: {
        sidecar: {
          getSidecarConfig$: jest.fn().mockReturnValue(of({ paddingSize: 400 })),
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
    it('should initialize chat service when enabled', () => {
      plugin.start(mockCoreStart, mockDeps);

      // ChatService is called without arguments (uses proxy endpoint)
      expect(ChatService).toHaveBeenCalledWith();
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

    it('should initialize chat service even without agUiUrl config', () => {
      // agUiUrl is server-side config only; client doesn't need it
      mockInitializerContext.config.get = jest.fn().mockReturnValue({ enabled: true });
      const testPlugin = new ChatPlugin(mockInitializerContext);

      const startContract = testPlugin.start(mockCoreStart, mockDeps);

      // ChatService should still be created (uses proxy endpoint)
      expect(ChatService).toHaveBeenCalledWith();
      expect(startContract.chatService).toBeInstanceOf(ChatService);
      expect(mockCoreStart.chrome.navControls.registerPrimaryHeaderRight).toHaveBeenCalled();
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
        { enabled: true }, // Missing agUiUrl (still works with proxy)
        {}, // Missing both enabled and agUiUrl
      ];

      configs.forEach((config, index) => {
        jest.clearAllMocks();
        mockInitializerContext.config.get = jest.fn().mockReturnValue(config);
        const testPlugin = new ChatPlugin(mockInitializerContext);

        expect(() => testPlugin.start(mockCoreStart, mockDeps)).not.toThrow();

        // ChatService is initialized whenever enabled is true (regardless of agUiUrl)
        if (config.enabled) {
          expect(ChatService).toHaveBeenCalledWith();
        } else {
          expect(ChatService).not.toHaveBeenCalled();
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

  describe('localStorage persistence', () => {
    let mockLocalStorage: { [key: string]: string };
    let mockChatService: any;
    let originalLocalStorage: Storage;

    beforeEach(() => {
      // Save original localStorage
      originalLocalStorage = window.localStorage;

      // Mock localStorage
      mockLocalStorage = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
          setItem: jest.fn((key: string, value: string) => {
            mockLocalStorage[key] = value;
          }),
          removeItem: jest.fn((key: string) => {
            delete mockLocalStorage[key];
          }),
          clear: jest.fn(() => {
            mockLocalStorage = {};
          }),
        },
        writable: true,
        configurable: true,
      });

      // Create a mock ChatService instance
      mockChatService = {
        setWindowState: jest.fn(),
        onWindowStateChange: jest.fn().mockReturnValue(jest.fn()),
      };
    });

    afterEach(() => {
      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });

    it('should restore window state from localStorage on start', () => {
      // Set initial state in localStorage
      mockLocalStorage['chat.windowState'] = JSON.stringify({
        isWindowOpen: true,
        windowMode: 'fullscreen',
        paddingSize: 500,
      });

      // Mock ChatService to return our controlled instance
      (ChatService as jest.MockedClass<typeof ChatService>).mockImplementation(
        () => mockChatService
      );

      plugin.start(mockCoreStart, mockDeps);

      expect(mockChatService.setWindowState).toHaveBeenCalledWith({
        isWindowOpen: true,
        windowMode: 'fullscreen',
        paddingSize: 500,
      });
    });

    it('should persist window state changes to localStorage', () => {
      let stateChangeCallback: any;
      mockChatService.onWindowStateChange = jest.fn((callback) => {
        stateChangeCallback = callback;
        return jest.fn();
      });

      // Mock ChatService to return our controlled instance
      (ChatService as jest.MockedClass<typeof ChatService>).mockImplementation(
        () => mockChatService
      );

      plugin.start(mockCoreStart, mockDeps);

      // Simulate window state change
      stateChangeCallback({ isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 });

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'chat.windowState',
        JSON.stringify({
          isWindowOpen: true,
          windowMode: 'sidecar',
          paddingSize: 400,
        })
      );
    });

    it('should not restore invalid state from localStorage', () => {
      // Set invalid state in localStorage
      mockLocalStorage['chat.windowState'] = JSON.stringify({
        isWindowOpen: 'invalid',
        windowMode: 'invalid-mode',
      });

      // Mock ChatService to return our controlled instance
      (ChatService as jest.MockedClass<typeof ChatService>).mockImplementation(
        () => mockChatService
      );

      plugin.start(mockCoreStart, mockDeps);

      // Should not call setWindowState with invalid data from localStorage
      // but will be called with paddingSize from sidecar config subscription
      expect(mockChatService.setWindowState).toHaveBeenCalledTimes(1);
      expect(mockChatService.setWindowState).toHaveBeenCalledWith({ paddingSize: 400 });
    });
  });
});
