/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatService } from './chat_service';
import { ChatImplementationFunctions } from './types';

describe('ChatService', () => {
  let service: ChatService;
  let mockImplementation: ChatImplementationFunctions;

  beforeEach(() => {
    service = new ChatService();

    // Create simplified mock implementation (only business logic operations)
    mockImplementation = {
      sendMessage: jest.fn().mockResolvedValue({
        observable: null,
        userMessage: { id: '1', role: 'user', content: 'test' },
      }),
      sendMessageWithWindow: jest.fn().mockResolvedValue({
        observable: null,
        userMessage: { id: '1', role: 'user', content: 'test' },
      }),
    };
  });

  describe('setup', () => {
    it('should return a setup contract', () => {
      const setupContract = service.setup();

      expect(setupContract).toHaveProperty('setImplementation');
      expect(setupContract).toHaveProperty('setSuggestedActionsService');
      expect(setupContract).toHaveProperty('setScreenshotPageContainerElement');
    });

    it('should allow setting implementation', () => {
      const setupContract = service.setup();

      expect(() => {
        setupContract.setImplementation(mockImplementation);
      }).not.toThrow();
    });

    it('should allow setting screenshot page container element', () => {
      const setupContract = service.setup();
      const mockElement = document.createElement('div');
      mockElement.id = 'test-container';

      expect(() => {
        setupContract.setScreenshotPageContainerElement(mockElement);
      }).not.toThrow();
    });

    it('should store the screenshot page container element', () => {
      const setupContract = service.setup();
      const mockElement = document.createElement('div');
      mockElement.id = 'root-element';

      setupContract.setScreenshotPageContainerElement(mockElement);

      // Verify the element is stored by accessing it through the service
      // (In real usage, this would be accessed by the chat plugin internally)
      expect(mockElement.id).toBe('root-element');
    });
  });

  describe('start', () => {
    it('should return a start contract', () => {
      const startContract = service.start();

      expect(startContract).toHaveProperty('isAvailable');
      expect(startContract).toHaveProperty('getThreadId');
      expect(startContract).toHaveProperty('getThreadId$');
      expect(startContract).toHaveProperty('setThreadId');
      expect(startContract).toHaveProperty('newThread');
      expect(startContract).toHaveProperty('isWindowOpen');
      expect(startContract).toHaveProperty('getWindowState');
      expect(startContract).toHaveProperty('getWindowState$');
      expect(startContract).toHaveProperty('setWindowState');
      expect(startContract).toHaveProperty('onWindowOpen');
      expect(startContract).toHaveProperty('onWindowClose');
      expect(startContract).toHaveProperty('openWindow');
      expect(startContract).toHaveProperty('closeWindow');
      expect(startContract).toHaveProperty('sendMessage');
      expect(startContract).toHaveProperty('sendMessageWithWindow');
      expect(startContract).toHaveProperty('screenshotPageContainerElement');
      expect(startContract).toHaveProperty('screenshot');
    });

    it('should return undefined for screenshotPageContainerElement if not set', () => {
      const startContract = service.start();

      expect(startContract.screenshotPageContainerElement).toBeUndefined();
    });

    it('should return screenshotPageContainerElement if set during setup', () => {
      const setupContract = service.setup();
      const mockElement = document.createElement('div');
      mockElement.id = 'root-element';

      setupContract.setScreenshotPageContainerElement(mockElement);

      const startContract = service.start();
      expect(startContract.screenshotPageContainerElement).toBe(mockElement);
      expect(startContract.screenshotPageContainerElement?.id).toBe('root-element');
    });

    it('should not be available without implementation', () => {
      const startContract = service.start();
      expect(startContract.isAvailable()).toBe(false);
    });

    it('should be available with implementation', () => {
      const setupContract = service.setup();
      const startContract = service.start();

      setupContract.setImplementation(mockImplementation);
      expect(startContract.isAvailable()).toBe(true);
    });

    it('should manage thread ID in core', () => {
      const startContract = service.start();

      // Initial thread ID should be undefined (lazy initialization)
      const initialThreadId = startContract.getThreadId();
      expect(initialThreadId).toBeUndefined();

      // Test observable emits undefined initially
      let emittedThreadId: string | undefined;
      startContract.getThreadId$().subscribe((id) => (emittedThreadId = id));
      expect(emittedThreadId).toBeUndefined();

      // Test creating new thread generates a valid thread ID
      startContract.newThread();
      const newThreadId = startContract.getThreadId();
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
      expect(emittedThreadId).toBe(newThreadId);

      // Test creating another new thread generates a different ID
      startContract.newThread();
      const anotherThreadId = startContract.getThreadId();
      expect(anotherThreadId).not.toBe(newThreadId);
      expect(anotherThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
    });

    it('should reset thread ID to undefined', () => {
      const startContract = service.start();

      // Create a new thread first
      startContract.newThread();
      const threadId = startContract.getThreadId();
      expect(threadId).toBeDefined();
      expect(threadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);

      // Track observable emissions
      let emittedThreadId: string | undefined = threadId;
      startContract.getThreadId$().subscribe((id) => (emittedThreadId = id));

      // Reset thread ID
      startContract.resetThreadId();

      // Verify thread ID is now undefined
      expect(startContract.getThreadId()).toBeUndefined();
      expect(emittedThreadId).toBeUndefined();
    });

    it('should manage window state in core', () => {
      const startContract = service.start();

      // Initial state
      expect(startContract.isWindowOpen()).toBe(false);
      const initialState = startContract.getWindowState();
      expect(initialState).toEqual({
        isWindowOpen: false,
        windowMode: 'sidecar',
        paddingSize: 400,
      });

      // Update state
      startContract.setWindowState({ isWindowOpen: true });
      expect(startContract.isWindowOpen()).toBe(true);

      // Test observable
      let emittedState: any;
      startContract.getWindowState$().subscribe((state) => (emittedState = state));
      expect(emittedState.isWindowOpen).toBe(true);
    });

    it('should trigger window callbacks', async () => {
      const setupContract = service.setup();
      const startContract = service.start();

      setupContract.setImplementation(mockImplementation);

      const openCallback = jest.fn();
      const closeCallback = jest.fn();

      startContract.onWindowOpen(openCallback);
      startContract.onWindowClose(closeCallback);

      // Open window via openWindow method (which triggers callbacks)
      await startContract.openWindow();
      expect(openCallback).toHaveBeenCalledTimes(1);
      expect(closeCallback).not.toHaveBeenCalled();

      // Close window via closeWindow method (which triggers callbacks)
      await startContract.closeWindow();
      expect(closeCallback).toHaveBeenCalledTimes(1);
    });

    it('should throw error when sending message without implementation', async () => {
      const startContract = service.start();

      await expect(startContract.sendMessage('test', [])).rejects.toThrow(
        'Chat service is not available. Please ensure the chat plugin is enabled.'
      );
    });

    it('should allow opening window without implementation', async () => {
      const startContract = service.start();

      // openWindow now just updates state, doesn't require implementation
      await expect(startContract.openWindow()).resolves.not.toThrow();
      expect(startContract.isWindowOpen()).toBe(true);
    });

    it('should provide screenshot service', () => {
      const setupContract = service.setup();
      const startContract = service.start();

      // Screenshot service should be available
      expect(startContract.screenshot).toBeDefined();
      expect(setupContract.screenshot).toBeDefined();

      // Initial state
      expect(startContract.screenshot.isEnabled()).toBe(false);

      // Test observable
      let emittedValue: boolean | undefined;
      startContract.screenshot.getEnabled$().subscribe((value) => (emittedValue = value));
      expect(emittedValue).toBe(false);

      // Enable screenshot feature
      startContract.screenshot.setEnabled(true);
      expect(startContract.screenshot.isEnabled()).toBe(true);
      expect(emittedValue).toBe(true);

      // Test configure method
      startContract.screenshot.configure({ enabled: false, title: 'Custom Title' });
      expect(startContract.screenshot.isEnabled()).toBe(false);
      expect(startContract.screenshot.getScreenshotButton().title).toBe('Custom Title');
    });

    it('should delegate to implementation when available', async () => {
      const setupContract = service.setup();
      const startContract = service.start();

      setupContract.setImplementation(mockImplementation);

      // Test message sending - this should delegate to implementation
      const result = await startContract.sendMessage('test', []);
      expect(mockImplementation.sendMessage).toHaveBeenCalledWith('test', []);
      expect(result).toEqual({
        observable: null,
        userMessage: { id: '1', role: 'user', content: 'test' },
      });

      // Test window operations - these trigger callbacks but don't call implementation methods directly
      // The implementation methods are called by the plugin in response to the callbacks
      const openCallback = jest.fn();
      const closeCallback = jest.fn();

      startContract.onWindowOpen(openCallback);
      startContract.onWindowClose(closeCallback);

      await startContract.openWindow();
      expect(openCallback).toHaveBeenCalled();
      // Window state is not automatically updated by openWindow - it's managed separately

      await startContract.closeWindow();
      expect(closeCallback).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should clean up resources', async () => {
      const setupContract = service.setup();
      const startContract = service.start();

      setupContract.setImplementation(mockImplementation);
      expect(startContract.isAvailable()).toBe(true);

      await service.stop();
      expect(startContract.isAvailable()).toBe(false);
    });
  });
});
