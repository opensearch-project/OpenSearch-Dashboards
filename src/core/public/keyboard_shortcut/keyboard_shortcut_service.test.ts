/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyboardShortcutService } from './keyboard_shortcut_service';
import { ShortcutDefinition } from './types';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let mockExecute: jest.Mock;
  let mockExecute2: jest.Mock;

  beforeEach(() => {
    service = new KeyboardShortcutService();
    mockExecute = jest.fn();
    mockExecute2 = jest.fn();

    jest.spyOn(document, 'addEventListener');
    jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    service.stop();
    jest.restoreAllMocks();
  });

  describe('Service Lifecycle', () => {
    it('should create service with setup and start methods', () => {
      expect(service).toHaveProperty('setup');
      expect(service).toHaveProperty('start');
      expect(service).toHaveProperty('stop');
      expect(typeof service.setup).toBe('function');
      expect(typeof service.start).toBe('function');
      expect(typeof service.stop).toBe('function');
    });

    it('should return setup interface with register method', () => {
      const setup = service.setup();
      expect(setup).toHaveProperty('register');
      expect(typeof setup.register).toBe('function');
    });

    it('should return start interface with register and unregister methods', () => {
      const start = service.start();
      expect(start).toHaveProperty('register');
      expect(start).toHaveProperty('unregister');
      expect(typeof start.register).toBe('function');
      expect(typeof start.unregister).toBe('function');
    });

    it('should add event listener when started', () => {
      service.start();
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    });

    it('should remove event listener when stopped', () => {
      service.start();
      service.stop();
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        true
      );
    });
  });

  describe('Shortcut Registration', () => {
    it('should register shortcut during setup phase', () => {
      const setup = service.setup();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };

      expect(() => setup.register(shortcut)).not.toThrow();
    });

    it('should register shortcut during start phase', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };

      expect(() => start.register(shortcut)).not.toThrow();
    });

    it('should handle multiple shortcuts for same key combination', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'saveAs',
        pluginId: 'editor',
        name: 'Save As',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute2,
      };

      expect(() => {
        start.register(shortcut1);
        start.register(shortcut2);
      }).not.toThrow();
    });
  });

  describe('Shortcut Unregistration', () => {
    it('should unregister shortcut by id and pluginId', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      expect(() => start.unregister({ id: 'save', pluginId: 'editor' })).not.toThrow();
    });

    it('should handle unregistering non-existent shortcut gracefully', () => {
      const start = service.start();
      expect(() => start.unregister({ id: 'nonexistent', pluginId: 'test' })).not.toThrow();
    });
  });

  describe('Private Method Testing', () => {
    it('should create namespaced ID correctly', () => {
      const shortcut = { id: 'Save', pluginId: 'Editor' };
      // @ts-expect-error
      const result = service.getNamespacedId(shortcut);
      expect(result).toBe('save.editor');
    });
  });

  describe('Key Normalization', () => {
    it('should normalize keys to lowercase', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'CTRL+S',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'save2',
        pluginId: 'editor',
        name: 'Save Document 2',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute2,
      };

      start.register(shortcut1);
      start.register(shortcut2);

      const event = new KeyboardEvent('keydown', {
        key: 'S',
        ctrlKey: true,
        bubbles: true,
      });

      jest.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(mockExecute2).toHaveBeenCalledTimes(1);
      expect(mockExecute).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should execute shortcut when matching key is pressed', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };

      start.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      jest.spyOn(event, 'preventDefault');
      document.dispatchEvent(event);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should execute only the last registered shortcut for same key', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'saveAs',
        pluginId: 'editor',
        name: 'Save As',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute2,
      };

      start.register(shortcut1);
      start.register(shortcut2);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      expect(mockExecute2).toHaveBeenCalledTimes(1);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should ignore events from input and textarea elements', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'ctrl+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: input });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should handle modifier keys correctly', () => {
      const start = service.start();
      const shortcuts = [
        {
          id: 'save',
          pluginId: 'editor',
          name: 'Save',
          category: 'editing',
          keys: 'ctrl+s',
          execute: jest.fn(),
        },
        {
          id: 'saveAs',
          pluginId: 'editor',
          name: 'Save As',
          category: 'editing',
          keys: 'ctrl+shift+s',
          execute: jest.fn(),
        },
        {
          id: 'find',
          pluginId: 'editor',
          name: 'Find',
          category: 'editing',
          keys: 'alt+f',
          execute: jest.fn(),
        },
      ];

      shortcuts.forEach((shortcut) => start.register(shortcut));

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
        })
      );
      expect(shortcuts[0].execute).toHaveBeenCalledTimes(1);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          shiftKey: true,
        })
      );
      expect(shortcuts[1].execute).toHaveBeenCalledTimes(1);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'f',
          altKey: true,
        })
      );
      expect(shortcuts[2].execute).toHaveBeenCalledTimes(1);
    });
  });
});
