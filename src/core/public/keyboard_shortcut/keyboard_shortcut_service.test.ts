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

      const registeredIds = (service as any).register(shortcuts);
      expect(registeredIds).toEqual(['test.testPlugin']);

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
    it('detects text inputs correctly', () => {
      const textInput = document.createElement('input');
      textInput.type = 'text';

      const result = (service as any).isTextInputActive(textInput);
      expect(result).toBe(true);
    });

    it('detects textarea correctly', () => {
      const textarea = document.createElement('textarea');

      const result = (service as any).isTextInputActive(textarea);
      expect(result).toBe(true);
    });

    it('detects contenteditable correctly', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';

      const result = (service as any).isTextInputActive(div);
      expect(result).toBe(true);
    });

    it('returns false for non-input elements', () => {
      const div = document.createElement('div');

      const result = (service as any).isTextInputActive(div);
      expect(result).toBe(false);
    });
  });
});
