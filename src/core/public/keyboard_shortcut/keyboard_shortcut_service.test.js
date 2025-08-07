/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { keyboardShortcutServiceMock } from './keyboard_shortcut_service.mock';

describe('KeyboardShortcutService Mock', () => {
  let mockService;
  let mockSetup;
  let mockStart;

  beforeEach(() => {
    mockService = keyboardShortcutServiceMock.create();
    mockSetup = keyboardShortcutServiceMock.createSetup();
    mockStart = keyboardShortcutServiceMock.createStart();
  });

  describe('Service Mock Creation', () => {
    it('should create a mock service with all required methods', () => {
      expect(mockService).toHaveProperty('setup');
      expect(mockService).toHaveProperty('start');
      expect(mockService).toHaveProperty('stop');
      expect(typeof mockService.setup).toBe('function');
      expect(typeof mockService.start).toBe('function');
      expect(typeof mockService.stop).toBe('function');
    });

    it('should create setup mock with register method', () => {
      expect(mockSetup).toHaveProperty('register');
      expect(typeof mockSetup.register).toBe('function');
      expect(jest.isMockFunction(mockSetup.register)).toBe(true);
    });

    it('should create start mock with register and unregister methods', () => {
      expect(mockStart).toHaveProperty('register');
      expect(mockStart).toHaveProperty('unregister');
      expect(typeof mockStart.register).toBe('function');
      expect(typeof mockStart.unregister).toBe('function');
      expect(jest.isMockFunction(mockStart.register)).toBe(true);
      expect(jest.isMockFunction(mockStart.unregister)).toBe(true);
    });
  });

  describe('Mock Service Behavior', () => {
    it('should return setup mock when setup is called', () => {
      const setup = mockService.setup();
      expect(setup).toHaveProperty('register');
      expect(jest.isMockFunction(setup.register)).toBe(true);
    });

    it('should return start mock when start is called', () => {
      const start = mockService.start();
      expect(start).toHaveProperty('register');
      expect(start).toHaveProperty('unregister');
      expect(jest.isMockFunction(start.register)).toBe(true);
      expect(jest.isMockFunction(start.unregister)).toBe(true);
    });

    it('should track calls to setup method', () => {
      mockService.setup();
      expect(mockService.setup).toHaveBeenCalledTimes(1);
    });

    it('should track calls to start method', () => {
      mockService.start();
      expect(mockService.start).toHaveBeenCalledTimes(1);
    });

    it('should track calls to stop method', () => {
      mockService.stop();
      expect(mockService.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mock Setup Behavior', () => {
    it('should track calls to register method', () => {
      const shortcuts = [
        {
          id: 'test-shortcut',
          pluginId: 'test-plugin',
          keys: 'ctrl+k',
          execute: jest.fn(),
        },
      ];

      mockSetup.register(shortcuts);
      expect(mockSetup.register).toHaveBeenCalledTimes(1);
      expect(mockSetup.register).toHaveBeenCalledWith(shortcuts);
    });
  });

  describe('Mock Start Behavior', () => {
    it('should track calls to register method', () => {
      const shortcuts = [
        {
          id: 'test-shortcut',
          pluginId: 'test-plugin',
          keys: 'ctrl+k',
          execute: jest.fn(),
        },
      ];

      mockStart.register(shortcuts);
      expect(mockStart.register).toHaveBeenCalledTimes(1);
      expect(mockStart.register).toHaveBeenCalledWith(shortcuts);
    });

    it('should track calls to unregister method', () => {
      const shortcutId = 'test-shortcut.test-plugin';

      mockStart.unregister(shortcutId);
      expect(mockStart.unregister).toHaveBeenCalledTimes(1);
      expect(mockStart.unregister).toHaveBeenCalledWith(shortcutId);
    });
  });

  describe('Mock Integration', () => {
    it('should work with service lifecycle', () => {
      const setup = mockService.setup();
      const start = mockService.start();

      const setupShortcuts = [
        { id: 'setup-shortcut', pluginId: 'test', keys: 'ctrl+s', execute: jest.fn() },
      ];
      setup.register(setupShortcuts);

      const startShortcuts = [
        { id: 'start-shortcut', pluginId: 'test', keys: 'ctrl+t', execute: jest.fn() },
      ];
      start.register(startShortcuts);

      start.unregister('start-shortcut.test');

      mockService.stop();

      expect(mockService.setup).toHaveBeenCalledTimes(1);
      expect(mockService.start).toHaveBeenCalledTimes(1);
      expect(mockService.stop).toHaveBeenCalledTimes(1);
      expect(setup.register).toHaveBeenCalledWith(setupShortcuts);
      expect(start.register).toHaveBeenCalledWith(startShortcuts);
      expect(start.unregister).toHaveBeenCalledWith('start-shortcut.test');
    });
  });
});
