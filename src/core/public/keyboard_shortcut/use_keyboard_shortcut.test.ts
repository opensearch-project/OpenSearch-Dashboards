/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react-hooks';
import { useKeyboardShortcut } from './use_keyboard_shortcut';
import { ShortcutDefinition } from './types';
import { KeyboardShortcutService } from './keyboard_shortcut_service';

describe('useKeyboardShortcut', () => {
  let mockKeyboardShortcutService: jest.Mocked<KeyboardShortcutService>;
  let mockShortcut: ShortcutDefinition;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockKeyboardShortcutService = {
      register: jest.fn(),
      unregister: jest.fn(),
    } as any;

    mockShortcut = {
      id: 'test-shortcut',
      pluginId: 'testPlugin',
      name: 'Test Shortcut',
      category: 'test',
      keys: 'cmd+s',
      execute: jest.fn(),
    };

    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy.mockRestore();
  });

  describe('successful registration', () => {
    it('should register shortcut when service is available', () => {
      renderHook(() => useKeyboardShortcut(mockShortcut, mockKeyboardShortcutService));

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcut);
    });

    it('should unregister shortcut on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcut(mockShortcut, mockKeyboardShortcutService)
      );

      unmount();

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledWith({
        id: 'test-shortcut',
        pluginId: 'testPlugin',
      });
    });

    it('should re-register shortcut when shortcut definition changes', () => {
      const newShortcut = {
        id: 'new-shortcut',
        pluginId: 'testPlugin',
        name: 'New Shortcut',
        category: 'test',
        keys: 'cmd+n',
        execute: jest.fn(),
      };

      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      rerender({ shortcut: newShortcut });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenLastCalledWith(newShortcut);
    });

    it('should re-register when individual shortcut properties change', () => {
      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      // Change just the keys property
      const updatedShortcut = { ...mockShortcut, keys: 'ctrl+s' };
      rerender({ shortcut: updatedShortcut });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenLastCalledWith(updatedShortcut);
    });

    it('should re-register when execute function changes', () => {
      const newExecute = jest.fn();

      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      const updatedShortcut = { ...mockShortcut, execute: newExecute };
      rerender({ shortcut: updatedShortcut });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenLastCalledWith(updatedShortcut);
    });

    it('should not re-register when shortcut object reference changes but content is same', () => {
      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      const sameContentShortcut = {
        id: 'test-shortcut',
        pluginId: 'testPlugin',
        name: 'Test Shortcut',
        category: 'test',
        keys: 'cmd+s',
        execute: mockShortcut.execute,
      };

      rerender({ shortcut: sameContentShortcut });

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });
  });

  describe('service unavailable', () => {
    it('should handle null keyboard shortcut service gracefully', () => {
      renderHook(() => useKeyboardShortcut(mockShortcut, null as any));

      expect(mockKeyboardShortcutService.register).not.toHaveBeenCalled();
    });

    it('should handle undefined keyboard shortcut service gracefully', () => {
      renderHook(() => useKeyboardShortcut(mockShortcut, undefined as any));

      expect(mockKeyboardShortcutService.register).not.toHaveBeenCalled();
    });

    it('should log warning when service is not available in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderHook(() => useKeyboardShortcut(mockShortcut, null as any));

      expect(consoleWarnSpy).toHaveBeenCalledWith('keyboardShortcutService is not available.');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log warning when service is not available in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderHook(() => useKeyboardShortcut(mockShortcut, null as any));

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('error handling', () => {
    it('should let registration errors bubble up (crash immediately)', () => {
      mockKeyboardShortcutService.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      expect(() => {
        renderHook(() => useKeyboardShortcut(mockShortcut, mockKeyboardShortcutService));
      }).not.toThrow();

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcut);
      expect(mockKeyboardShortcutService.register).toThrow('Registration failed');
    });

    it('should handle unregistration errors gracefully', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcut(mockShortcut, mockKeyboardShortcutService)
      );

      mockKeyboardShortcutService.unregister.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });

      expect(() => unmount()).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to unregister shortcut test-shortcut:',
        expect.any(Error)
      );
    });

    it('should not log unregistration errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { unmount } = renderHook(() =>
        useKeyboardShortcut(mockShortcut, mockKeyboardShortcutService)
      );

      mockKeyboardShortcutService.unregister.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });

      unmount();

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('dependency optimization', () => {
    it('should use individual shortcut properties as dependencies', () => {
      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      const newShortcutObject = { ...mockShortcut };
      rerender({ shortcut: newShortcutObject });

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });

    it('should re-register when service changes', () => {
      const newService = {
        register: jest.fn(),
        unregister: jest.fn(),
      } as any;

      const { rerender } = renderHook(({ service }) => useKeyboardShortcut(mockShortcut, service), {
        initialProps: { service: mockKeyboardShortcutService },
      });

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      rerender({ service: newService });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(newService.register).toHaveBeenCalledTimes(1);
      expect(newService.register).toHaveBeenCalledWith(mockShortcut);
    });
  });

  describe('performance optimization', () => {
    it('should prevent unnecessary re-registrations with stable function references', () => {
      const stableExecute = jest.fn();
      const shortcut1 = {
        id: 'test',
        pluginId: 'plugin',
        name: 'Test',
        category: 'test',
        keys: 'cmd+s',
        execute: stableExecute,
      };

      const { rerender } = renderHook(
        ({ shortcut }) => useKeyboardShortcut(shortcut, mockKeyboardShortcutService),
        { initialProps: { shortcut: shortcut1 } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      const shortcut2 = {
        id: 'test',
        pluginId: 'plugin',
        name: 'Test',
        category: 'test',
        keys: 'cmd+s',
        execute: stableExecute,
      };

      rerender({ shortcut: shortcut2 });

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });

    it('should re-register when execute function reference changes', () => {
      const execute1 = jest.fn();
      const execute2 = jest.fn();

      const { rerender } = renderHook(
        ({ execute }) =>
          useKeyboardShortcut({ ...mockShortcut, execute }, mockKeyboardShortcutService),
        { initialProps: { execute: execute1 } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      rerender({ execute: execute2 });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
    });
  });
});
