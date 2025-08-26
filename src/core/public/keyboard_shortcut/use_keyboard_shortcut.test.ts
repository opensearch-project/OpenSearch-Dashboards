/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react-hooks';
import { useKeyboardShortcut } from './use_keyboard_shortcut';
import { ShortcutDefinition, KeyboardShortcutStart } from './types';

describe('useKeyboardShortcut', () => {
  let mockKeyboardShortcutService: jest.Mocked<KeyboardShortcutStart>;
  let mockShortcut: ShortcutDefinition;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockKeyboardShortcutService = {
      register: jest.fn(),
      unregister: jest.fn(),
    };

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
      renderHook(() =>
        useKeyboardShortcut({
          shortcut: mockShortcut,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcut);
    });

    it('should unregister shortcut on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcut({
          shortcut: mockShortcut,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
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
        ({ shortcut }) =>
          useKeyboardShortcut({
            shortcut,
            keyboardShortcutService: mockKeyboardShortcutService,
          }),
        { initialProps: { shortcut: mockShortcut } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      rerender({ shortcut: newShortcut });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenLastCalledWith(newShortcut);
    });
  });

  describe('service unavailable', () => {
    it('should handle null keyboard shortcut service gracefully', () => {
      renderHook(() =>
        useKeyboardShortcut({
          shortcut: mockShortcut,
          keyboardShortcutService: null,
        })
      );

      expect(mockKeyboardShortcutService.register).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should let registration errors bubble up (crash immediately)', () => {
      mockKeyboardShortcutService.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });

      expect(() => {
        renderHook(() =>
          useKeyboardShortcut({
            shortcut: mockShortcut,
            keyboardShortcutService: mockKeyboardShortcutService,
          })
        );
      }).not.toThrow();

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcut);
      expect(mockKeyboardShortcutService.register).toThrow('Registration failed');
    });

    it('should handle unregistration errors gracefully', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcut({
          shortcut: mockShortcut,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );

      mockKeyboardShortcutService.unregister.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });

      unmount();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to unregister shortcut test-shortcut:',
        expect.any(Error)
      );
    });

    it('should not log unregistration errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { unmount } = renderHook(() =>
        useKeyboardShortcut({
          shortcut: mockShortcut,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );

      mockKeyboardShortcutService.unregister.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });

      unmount();

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('dependencies', () => {
    it('should re-register shortcut when dependencies change', () => {
      let dependency = 'initial';

      const { rerender } = renderHook(
        ({ dep }) =>
          useKeyboardShortcut({
            shortcut: mockShortcut,
            keyboardShortcutService: mockKeyboardShortcutService,
            dependencies: [dep],
          }),
        { initialProps: { dep: dependency } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      dependency = 'changed';
      rerender({ dep: dependency });

      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
    });

    it('should not re-register when dependencies do not change', () => {
      const dependency = 'constant';

      const { rerender } = renderHook(
        ({ dep }) =>
          useKeyboardShortcut({
            shortcut: mockShortcut,
            keyboardShortcutService: mockKeyboardShortcutService,
            dependencies: [dep],
          }),
        { initialProps: { dep: dependency } }
      );

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);

      rerender({ dep: dependency });

      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });
  });
});
