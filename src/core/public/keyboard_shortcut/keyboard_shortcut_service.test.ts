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

import { KeyboardShortcutService } from './keyboard_shortcut_service';
import { ShortcutDefinition } from './types';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    service = new KeyboardShortcutService();
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    service.stop();
    mockConsoleWarn.mockRestore();
  });

  describe('Service Lifecycle', () => {
    it('initializes with empty shortcuts map', () => {
      expect((service as any).shortcuts.size).toBe(0);
    });

    it('provides setup interface', () => {
      const setup = service.setup();
      expect(setup).toHaveProperty('register');
      expect(typeof setup.register).toBe('function');
    });

    it('provides start interface', () => {
      const start = service.start();
      expect(start).toHaveProperty('register');
      expect(start).toHaveProperty('unregister');
      expect(typeof start.register).toBe('function');
      expect(typeof start.unregister).toBe('function');
    });

    it('cleans up on stop', () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: jest.fn(),
        },
      ];

      service.start();
      (service as any).register(shortcuts);
      expect((service as any).shortcuts.size).toBe(1);

      service.stop();
      expect((service as any).shortcuts.size).toBe(0);
    });
  });

  describe('Registration', () => {
    it('registers shortcuts correctly', () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: jest.fn(),
        },
      ];

      (service as any).register(shortcuts);

      const storedShortcuts = (service as any).shortcuts;
      expect(storedShortcuts.has('ctrl+s')).toBe(true);
    });

    it('unregisters shortcuts correctly', () => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: jest.fn(),
        },
      ];

      (service as any).register(shortcuts);
      expect((service as any).shortcuts.size).toBe(1);

      (service as any).unregister('test.testPlugin');
      expect((service as any).shortcuts.size).toBe(0);
    });
  });

  describe('Input Detection', () => {
    it('should ignore keyboard events for text inputs', () => {
      const textInput = document.createElement('input');
      textInput.type = 'text';

      const result = (service as any).shouldIgnoreKeyboardEventForTarget(textInput);
      expect(result).toBe(true);
    });

    it('should ignore keyboard events for textarea', () => {
      const textarea = document.createElement('textarea');

      const result = (service as any).shouldIgnoreKeyboardEventForTarget(textarea);
      expect(result).toBe(true);
    });

    it('should not ignore keyboard events for non-input elements', () => {
      const div = document.createElement('div');

      const result = (service as any).shouldIgnoreKeyboardEventForTarget(div);
      expect(result).toBe(false);
    });
  });

  describe('Event Handling', () => {
    let addEventListenerSpy: jest.SpyInstance;
    let removeEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
      addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('sets up event listener on start', () => {
      service.start();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    it('removes event listener on stop', () => {
      service.start();
      service.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    it('executes shortcut when matching key is pressed', () => {
      const mockExecute = jest.fn();
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: mockExecute,
        },
      ];

      service.start();
      (service as any).register(shortcuts);

      // Simulate Ctrl+S keydown event
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      // Mock preventDefault and stopPropagation
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      document.dispatchEvent(event);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('does not execute shortcut when key is pressed in text input', () => {
      const mockExecute = jest.fn();
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: mockExecute,
        },
      ];

      service.start();
      (service as any).register(shortcuts);

      // Create input element and add to DOM
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Simulate Ctrl+S keydown event on input
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true,
      });

      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    });

    it('handles execution errors gracefully', () => {
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockExecute = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: mockExecute,
        },
      ];

      service.start();
      (service as any).register(shortcuts);

      // Simulate Ctrl+S keydown event
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error executing keyboard shortcut test:',
        expect.any(Error)
      );

      mockConsoleError.mockRestore();
    });

    it('does not execute shortcut for non-matching keys', () => {
      const mockExecute = jest.fn();
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'test',
          pluginId: 'testPlugin',
          name: 'Test Shortcut',
          category: 'test',
          keys: 'ctrl+s',
          execute: mockExecute,
        },
      ];

      service.start();
      (service as any).register(shortcuts);

      // Simulate Ctrl+A keydown event (different key)
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });
});
