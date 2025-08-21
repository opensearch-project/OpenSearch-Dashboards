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
        keys: 'cmd+s',
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
        keys: 'cmd+s',
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
        keys: 'cmd+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'saveAs',
        pluginId: 'editor',
        name: 'Save As',
        category: 'editing',
        keys: 'cmd+s',
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
        keys: 'cmd+s',
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

  describe('Real-Time Conflict Detection', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should not warn when registering first shortcut for a key', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should warn immediately when registering conflicting shortcut', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'quickSave',
        pluginId: 'fileManager',
        name: 'Quick Save',
        category: 'file',
        keys: 'cmd+s',
        execute: mockExecute2,
      };

      start.register(shortcut1);
      start.register(shortcut2);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'keyboard shortcut conflict detected for key "cmd+s". ' +
          'New shortcut "quickSave" from plugin "fileManager" ' +
          'conflicts with active shortcuts: save (editor). ' +
          'The new shortcut will take precedence when the key is pressed.'
      );
    });

    it('should warn for each new conflicting shortcut', () => {
      const start = service.start();
      const shortcuts: ShortcutDefinition[] = [
        {
          id: 'save',
          pluginId: 'editor',
          name: 'Save',
          category: 'editing',
          keys: 'cmd+s',
          execute: jest.fn(),
        },
        {
          id: 'quickSave',
          pluginId: 'fileManager',
          name: 'Quick Save',
          category: 'file',
          keys: 'cmd+s',
          execute: jest.fn(),
        },
        {
          id: 'autoSave',
          pluginId: 'backup',
          name: 'Auto Save',
          category: 'backup',
          keys: 'cmd+s',
          execute: jest.fn(),
        },
      ];

      start.register(shortcuts[0]);
      start.register(shortcuts[1]);
      start.register(shortcuts[2]);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'keyboard shortcut conflict detected for key "cmd+s". ' +
          'New shortcut "quickSave" from plugin "fileManager" ' +
          'conflicts with active shortcuts: save (editor). ' +
          'The new shortcut will take precedence when the key is pressed.'
      );

      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        2,
        'keyboard shortcut conflict detected for key "cmd+s". ' +
          'New shortcut "autoSave" from plugin "backup" ' +
          'conflicts with active shortcuts: save (editor), quickSave (fileManager). ' +
          'The new shortcut will take precedence when the key is pressed.'
      );
    });

    it('should execute shortcuts without additional warnings', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'quickSave',
        pluginId: 'fileManager',
        name: 'Quick Save',
        category: 'file',
        keys: 'cmd+s',
        execute: mockExecute2,
      };

      start.register(shortcut1);
      start.register(shortcut2);

      consoleWarnSpy.mockClear();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      expect(mockExecute2).toHaveBeenCalledTimes(1);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should not warn after unregistering conflicting shortcuts', () => {
      const start = service.start();
      const shortcut1: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'quickSave',
        pluginId: 'fileManager',
        name: 'Quick Save',
        category: 'file',
        keys: 'cmd+s',
        execute: mockExecute2,
      };
      const shortcut3: ShortcutDefinition = {
        id: 'newSave',
        pluginId: 'newPlugin',
        name: 'New Save',
        category: 'file',
        keys: 'cmd+s',
        execute: jest.fn(),
      };

      start.register(shortcut1);
      start.register(shortcut2);
      consoleWarnSpy.mockClear();

      start.unregister({ id: 'save', pluginId: 'editor' });
      start.unregister({ id: 'quickSave', pluginId: 'fileManager' });

      start.register(shortcut3);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle same-page component conflicts with immediate warnings', () => {
      const start = service.start();

      const componentAShortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };
      start.register(componentAShortcut);

      const componentBShortcut: ShortcutDefinition = {
        id: 'export',
        pluginId: 'dashboard',
        name: 'Export',
        category: 'file',
        keys: 'cmd+s',
        execute: mockExecute2,
      };
      start.register(componentBShortcut);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'keyboard shortcut conflict detected for key "cmd+s". ' +
          'New shortcut "export" from plugin "dashboard" ' +
          'conflicts with active shortcuts: save (editor). ' +
          'The new shortcut will take precedence when the key is pressed.'
      );

      consoleWarnSpy.mockClear();

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(mockExecute2).toHaveBeenCalledTimes(1);
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should throw error for invalid key string during registration', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'invalid',
        pluginId: 'test',
        name: 'Invalid Shortcut',
        category: 'test',
        keys: 'invalid+++key',
        execute: mockExecute,
      };

      expect(() => start.register(shortcut)).toThrow(
        'Invalid key combination: "invalid+++key". Please refer to our documentation to see what is valid.'
      );
    });

    it('should throw error for duplicate shortcut registration', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save Document',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      expect(() => start.register(shortcut)).toThrow(
        'Shortcut "save" from plugin "editor" is already registered'
      );
    });

    it('should log error when shortcut execution fails', () => {
      const start = service.start();
      const failingExecute = jest.fn().mockImplementation(() => {
        throw new Error('Execution failed');
      });
      const shortcut: ShortcutDefinition = {
        id: 'failing',
        pluginId: 'test',
        name: 'Failing Shortcut',
        category: 'test',
        keys: 'cmd+f',
        execute: failingExecute,
      };

      start.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        code: 'KeyF',
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error executing shortcut failing from plugin test:',
        expect.any(Error)
      );
    });
  });

  describe('Element Filtering', () => {
    it('should ignore events from SELECT elements', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const select = document.createElement('select');
      document.body.appendChild(select);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: select });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(select);
    });

    it('should ignore events from elements with textbox role', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      div.setAttribute('role', 'textbox');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should ignore events from elements with combobox role', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      div.setAttribute('role', 'combobox');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should ignore events from elements with searchbox role', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      div.setAttribute('role', 'searchbox');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should handle events from regular elements', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).toHaveBeenCalledTimes(1);
      document.body.removeChild(div);
    });

    it('should ignore events from contenteditable elements', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should ignore events from contenteditable elements with empty string value', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);
      const div = document.createElement('div');
      div.setAttribute('contenteditable', '');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: div });
      document.dispatchEvent(event);

      expect(mockExecute).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should handle events with non-HTMLElement targets', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', { value: {} });
      document.dispatchEvent(event);

      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service Cleanup', () => {
    it('should clear all data structures on stop', () => {
      const start = service.start();
      const shortcut: ShortcutDefinition = {
        id: 'save',
        pluginId: 'editor',
        name: 'Save',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
      expect(mockExecute).toHaveBeenCalledTimes(1);

      service.stop();

      mockExecute.mockClear();
      document.dispatchEvent(event);
      expect(mockExecute).not.toHaveBeenCalled();
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
        keys: 'cmd+s',
        execute: mockExecute,
      };

      start.register(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
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
        keys: 'cmd+s',
        execute: mockExecute,
      };
      const shortcut2: ShortcutDefinition = {
        id: 'saveAs',
        pluginId: 'editor',
        name: 'Save As',
        category: 'editing',
        keys: 'cmd+s',
        execute: mockExecute2,
      };

      start.register(shortcut1);
      start.register(shortcut2);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
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
        keys: 'cmd+s',
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
          keys: 'cmd+s',
          execute: jest.fn(),
        },
        {
          id: 'saveAs',
          pluginId: 'editor',
          name: 'Save As',
          category: 'editing',
          keys: 'cmd+shift+s',
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
          code: 'KeyS',
          ctrlKey: true,
        })
      );
      expect(shortcuts[0].execute).toHaveBeenCalledTimes(1);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          ctrlKey: true,
          shiftKey: true,
        })
      );
      expect(shortcuts[1].execute).toHaveBeenCalledTimes(1);

      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'f',
          code: 'KeyF',
          altKey: true,
        })
      );
      expect(shortcuts[2].execute).toHaveBeenCalledTimes(1);
    });
  });
});
