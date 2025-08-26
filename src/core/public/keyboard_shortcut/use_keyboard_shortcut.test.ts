/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderHook } from '@testing-library/react-hooks';
import { useKeyboardShortcuts } from './use_keyboard_shortcut';
import { ShortcutDefinition, KeyboardShortcutStart } from './types';
describe('useKeyboardShortcuts', () => {
  let mockKeyboardShortcutService: jest.Mocked<KeyboardShortcutStart>;
  let mockShortcuts: ShortcutDefinition[];
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  beforeEach(() => {
    mockKeyboardShortcutService = {
      register: jest.fn(),
      unregister: jest.fn(),
    };
    mockShortcuts = [
      {
        id: 'test-shortcut-1',
        pluginId: 'testPlugin',
        name: 'Test Shortcut 1',
        category: 'test',
        keys: 'cmd+s',
        execute: jest.fn(),
      },
      {
        id: 'test-shortcut-2',
        pluginId: 'testPlugin',
        name: 'Test Shortcut 2',
        category: 'test',
        keys: 'cmd+c',
        execute: jest.fn(),
      },
    ];
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });
  afterEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });
  describe('successful registration', () => {
    it('should register all shortcuts when service is available', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcuts[0]);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledWith(mockShortcuts[1]);
      // Note: registeredShortcutIds is computed from ref and may not be immediately available in tests
      // In real usage, components re-render after useEffect and get the correct values
    });
    it('should unregister shortcuts on unmount', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      unmount();
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledWith({
        id: 'test-shortcut-1',
        pluginId: 'testPlugin',
      });
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledWith({
        id: 'test-shortcut-2',
        pluginId: 'testPlugin',
      });
    });
    it('should re-register shortcuts when shortcuts array changes', () => {
      const newShortcuts = [
        {
          id: 'new-shortcut',
          pluginId: 'testPlugin',
          name: 'New Shortcut',
          category: 'test',
          keys: 'cmd+n',
          execute: jest.fn(),
        },
      ];
      const { rerender } = renderHook(
        ({ shortcuts }) =>
          useKeyboardShortcuts({
            shortcuts,
            keyboardShortcutService: mockKeyboardShortcutService,
          }),
        { initialProps: { shortcuts: mockShortcuts } }
      );
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      rerender({ shortcuts: newShortcuts });
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(3); // 2 initial + 1 new
      expect(mockKeyboardShortcutService.register).toHaveBeenLastCalledWith(newShortcuts[0]);
    });
  });
  describe('service unavailable', () => {
    it('should handle null keyboard shortcut service gracefully', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: null,
        })
      );
      expect(mockKeyboardShortcutService.register).not.toHaveBeenCalled();
      expect(result.current.registeredShortcutIds).toEqual([]);
    });
    it('should not log warning in production when service is unavailable', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: null,
        })
      );
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
  });
  describe('error handling', () => {
    it('should continue registering other shortcuts when one fails', () => {
      mockKeyboardShortcutService.register
        .mockImplementationOnce(() => {
          throw new Error('Registration failed');
        })
        .mockImplementationOnce(() => {});
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to register shortcut test-shortcut-1:',
        expect.any(Error)
      );
    });
    it('should only unregister successfully registered shortcuts', () => {
      mockKeyboardShortcutService.register
        .mockImplementationOnce(() => {
          throw new Error('Registration failed');
        })
        .mockImplementationOnce(() => {});
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      unmount();
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(1);
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledWith({
        id: 'test-shortcut-2',
        pluginId: 'testPlugin',
      });
    });
    it('should handle unregistration errors gracefully', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      mockKeyboardShortcutService.unregister.mockImplementation(() => {
        throw new Error('Unregistration failed');
      });
      unmount();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to unregister shortcut test-shortcut-1:',
        expect.any(Error)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to unregister shortcut test-shortcut-2:',
        expect.any(Error)
      );
    });
    it('should not log errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockKeyboardShortcutService.register.mockImplementation(() => {
        throw new Error('Registration failed');
      });
      renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: mockShortcuts,
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
  });
  describe('dependencies', () => {
    it('should re-register shortcuts when dependencies change', () => {
      let dependency = 'initial';
      const { rerender } = renderHook(
        ({ dep }) =>
          useKeyboardShortcuts({
            shortcuts: mockShortcuts,
            keyboardShortcutService: mockKeyboardShortcutService,
            dependencies: [dep],
          }),
        { initialProps: { dep: dependency } }
      );
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      dependency = 'changed';
      rerender({ dep: dependency });
      expect(mockKeyboardShortcutService.unregister).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(4); // 2 initial + 2 re-register
    });
    it('should not re-register when dependencies do not change', () => {
      const dependency = 'constant';
      const { rerender } = renderHook(
        ({ dep }) =>
          useKeyboardShortcuts({
            shortcuts: mockShortcuts,
            keyboardShortcutService: mockKeyboardShortcutService,
            dependencies: [dep],
          }),
        { initialProps: { dep: dependency } }
      );
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      rerender({ dep: dependency });
      expect(mockKeyboardShortcutService.register).toHaveBeenCalledTimes(2);
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });
  });
  describe('empty shortcuts', () => {
    it('should handle empty shortcuts array', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [],
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      expect(mockKeyboardShortcutService.register).not.toHaveBeenCalled();
      expect(result.current.registeredShortcutIds).toEqual([]);
    });
    it('should not attempt cleanup with empty shortcuts', () => {
      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          shortcuts: [],
          keyboardShortcutService: mockKeyboardShortcutService,
        })
      );
      unmount();
      expect(mockKeyboardShortcutService.unregister).not.toHaveBeenCalled();
    });
  });
});
