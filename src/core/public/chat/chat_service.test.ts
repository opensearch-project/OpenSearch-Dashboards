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
      openWindow: jest.fn().mockResolvedValue(undefined),
      closeWindow: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('setup', () => {
    it('should return a setup contract', () => {
      const setupContract = service.setup();

      expect(setupContract).toHaveProperty('setImplementation');
      expect(setupContract).toHaveProperty('setSuggestedActionsService');
    });

    it('should allow setting implementation', () => {
      const setupContract = service.setup();

      expect(() => {
        setupContract.setImplementation(mockImplementation);
      }).not.toThrow();
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

      const initialThreadId = startContract.getThreadId();
      expect(initialThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);

      // Test observable
      let emittedThreadId: string | undefined;
      startContract.getThreadId$().subscribe((id) => (emittedThreadId = id));
      expect(emittedThreadId).toBe(initialThreadId);

      // Test setting new thread
      startContract.newThread();
      const newThreadId = startContract.getThreadId();
      expect(newThreadId).not.toBe(initialThreadId);
      expect(newThreadId).toMatch(/^thread-\d+-[a-z0-9]{9}$/);
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

    it('should throw error when opening window without implementation', async () => {
      const startContract = service.start();

      await expect(startContract.openWindow()).rejects.toThrow(
        'Chat service is not available. Please ensure the chat plugin is enabled.'
      );
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
