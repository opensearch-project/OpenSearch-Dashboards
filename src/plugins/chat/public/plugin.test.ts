/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
        get: jest.fn().mockReturnValue({ agUiUrl: 'http://test-ag-ui:3000' }),
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
          registerRight: jest.fn(),
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
    it('should return empty setup contract', () => {
      const setupContract = plugin.setup(mockCoreSetup);

      expect(setupContract).toEqual({});
    });
  });

  describe('start', () => {
    it('should initialize chat service with configured AG-UI URL', () => {
      plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).toHaveBeenCalledWith('http://test-ag-ui:3000');
    });

    it('should register chat button in header nav controls', () => {
      plugin.start(mockCoreStart, mockDeps);

      expect(mockCoreStart.chrome.navControls.registerRight).toHaveBeenCalledWith({
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
      mockInitializerContext.config.get = jest.fn().mockReturnValue({});

      plugin.start(mockCoreStart, mockDeps);

      expect(ChatService).toHaveBeenCalledWith(undefined);
    });
  });

  describe('header button visibility', () => {
    let mountFunction: Function;

    beforeEach(() => {
      plugin.start(mockCoreStart, mockDeps);

      // Get the mount function that was registered
      const registerCall = (mockCoreStart.chrome.navControls.registerRight as jest.Mock).mock
        .calls[0];
      mountFunction = registerCall[0].mount;
    });

    it('should show chat button when app starts with "explore"', () => {
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

    it('should hide chat button when app does not start with "explore"', () => {
      const mockElement = document.createElement('div');
      const mockUnmount = jest.fn();
      (toMountPoint as jest.Mock).mockReturnValue(jest.fn().mockReturnValue(mockUnmount));

      // Reset the mock to clear previous calls
      (toMountPoint as jest.Mock).mockClear();

      // Start with a fresh BehaviorSubject for non-explore app
      const nonExploreAppId$ = new BehaviorSubject<string | undefined>('dashboard');
      mockCoreStart.application.currentAppId$ = nonExploreAppId$;

      // Re-register the plugin with the new app ID
      plugin.start(mockCoreStart, mockDeps);
      const registerCall = (mockCoreStart.chrome.navControls.registerRight as jest.Mock).mock
        .calls[1];
      const newMountFunction = registerCall[0].mount;

      const cleanup = newMountFunction(mockElement);

      // Should not mount the component for non-explore apps
      expect(toMountPoint).not.toHaveBeenCalled();

      // Cleanup
      cleanup();
    });

    it('should handle app changes from explore to non-explore', () => {
      const mockElement = document.createElement('div');
      const mockUnmount = jest.fn();
      (toMountPoint as jest.Mock).mockReturnValue(jest.fn().mockReturnValue(mockUnmount));

      const cleanup = mountFunction(mockElement);

      // Start with explore app
      mockCurrentAppId$.next('explore-metrics');
      expect(toMountPoint).toHaveBeenCalled();

      // Change to non-explore app
      mockCurrentAppId$.next('discover');
      expect(mockUnmount).toHaveBeenCalled();

      // Cleanup
      cleanup();
    });

    it('should handle undefined app id', () => {
      const mockElement = document.createElement('div');

      // Reset the mock to clear previous calls
      (toMountPoint as jest.Mock).mockClear();

      // Create a new plugin instance for this test
      const testPlugin = new ChatPlugin(mockInitializerContext);

      // Start with a fresh BehaviorSubject for undefined app
      const undefinedAppId$ = new BehaviorSubject<string | undefined>(undefined);
      const testCoreStart = {
        ...mockCoreStart,
        application: {
          currentAppId$: undefinedAppId$,
        },
      };

      // Start the plugin with undefined app ID
      testPlugin.start(testCoreStart, mockDeps);
      const registerCall = (testCoreStart.chrome.navControls.registerRight as jest.Mock).mock
        .calls[0];
      const newMountFunction = registerCall[0].mount;

      const cleanup = newMountFunction(mockElement);

      expect(toMountPoint).not.toHaveBeenCalled();

      // Cleanup
      cleanup();
    });

    it('should cleanup subscription on unmount', () => {
      const mockElement = document.createElement('div');
      const mockSubscription = {
        unsubscribe: jest.fn(),
      };

      // Mock the subscription
      jest.spyOn(mockCurrentAppId$, 'subscribe').mockReturnValue(mockSubscription as any);

      const cleanup = mountFunction(mockElement);

      // Call cleanup
      cleanup();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
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
        { agUiUrl: 'http://localhost:3000' },
        { agUiUrl: 'https://remote-server:8080' },
        {},
      ];

      configs.forEach((config) => {
        mockInitializerContext.config.get = jest.fn().mockReturnValue(config);
        const testPlugin = new ChatPlugin(mockInitializerContext);

        expect(() => testPlugin.start(mockCoreStart, mockDeps)).not.toThrow();
      });
    });
  });

  describe('integration', () => {
    it('should pass correct props to ChatHeaderButton', () => {
      plugin.start(mockCoreStart, mockDeps);

      const registerCall = (mockCoreStart.chrome.navControls.registerRight as jest.Mock).mock
        .calls[0];
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
});
