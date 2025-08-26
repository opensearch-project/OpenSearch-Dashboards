/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyStringParser } from './key_parser';

describe('KeyStringParser', () => {
  let parser: KeyStringParser;

  beforeEach(() => {
    parser = new KeyStringParser();
  });

  describe('normalizeKeyString', () => {
    it('should normalize valid key strings to lowercase', () => {
      expect(parser.normalizeKeyString('CMD+S')).toBe('cmd+s');
      expect(parser.normalizeKeyString('Alt+Shift+A')).toBe('alt+shift+a');
      expect(parser.normalizeKeyString('ENTER')).toBe('enter');
    });

    it('should throw error for invalid key strings', () => {
      expect(() => parser.normalizeKeyString('f1')).toThrow('Invalid key combination: "f1"');
      expect(() => parser.normalizeKeyString('ctrl+s')).toThrow(
        'Invalid key combination: "ctrl+s"'
      );
      expect(() => parser.normalizeKeyString('')).toThrow('Invalid key combination: ""');
    });
  });

  describe('getEventKeyString', () => {
    describe('platform-specific modifier detection', () => {
      it('should use metaKey on Mac platform', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          configurable: true,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: true,
        });

        expect(parser.getEventKeyString(event)).toBe('cmd+s');
      });

      it('should use ctrlKey on Windows/Linux platform', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe('cmd+s');
      });

      it('should ignore ctrlKey on Mac platform', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          configurable: true,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe('s');
      });

      it('should ignore metaKey on Windows/Linux platform', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: true,
        });

        expect(parser.getEventKeyString(event)).toBe('s');
      });
    });

    it('should build key strings in canonical order', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'A',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('cmd+alt+shift+a');
    });

    it('should return empty string for unmapped key codes', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F1',
        code: 'F1',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('');
    });

    it('should handle single keys without modifiers', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('a');
    });
  });

  describe('getDisplayString', () => {
    it('should generate Mac-style display strings on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();

      expect(macParser.getDisplayString('cmd+s')).toBe('⌘S');
      expect(macParser.getDisplayString('shift+enter')).toBe('⇧↵');
      expect(macParser.getDisplayString('alt+backspace')).toBe('⌥⌫');
    });

    it('should generate Windows-style display strings on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();

      expect(winParser.getDisplayString('cmd+s')).toBe('Ctrl+S');
      expect(winParser.getDisplayString('shift+enter')).toBe('Shift+↵');
      expect(winParser.getDisplayString('alt+backspace')).toBe('Alt+⌫');
    });

    it('should handle keys without display mappings', () => {
      expect(parser.getDisplayString('cmd+a')).toMatch(/A$/);
      expect(parser.getDisplayString('shift+1')).toMatch(/1$/);
    });
  });

  describe('consistency between methods', () => {
    it('should produce consistent results between normalizeKeyString and getEventKeyString', () => {
      const normalizedString = parser.normalizeKeyString('cmd+shift+s');

      const event = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      });
      const eventString = parser.getEventKeyString(event);

      expect(normalizedString).toBe(eventString);
    });

    it('should handle single keys consistently', () => {
      const normalizedString = parser.normalizeKeyString('a');

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });
      const eventString = parser.getEventKeyString(event);

      expect(normalizedString).toBe(eventString);
    });
  });

  describe('platform detection', () => {
    it('should detect Mac platform correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      // Test through display string generation which uses platform detection
      expect(parser.getDisplayString('cmd+s')).toBe('⌘S');
    });

    it('should detect non-Mac platform correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      // Test through display string generation which uses platform detection
      expect(parser.getDisplayString('cmd+s')).toBe('Ctrl+S');
    });

    it('should handle undefined navigator', () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error
      delete global.navigator;

      // Should default to non-Mac behavior
      expect(parser.getDisplayString('cmd+s')).toBe('Ctrl+S');

      global.navigator = originalNavigator;
    });
  });
});
