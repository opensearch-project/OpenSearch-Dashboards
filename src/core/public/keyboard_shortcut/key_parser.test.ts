/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KeyStringParser,
  ALLOWED_KEYS,
  VALID_MODIFIER_COMBINATIONS,
  SEQUENCE_PREFIX,
  VALID_MODIFIERS,
} from './key_parser';

describe('KeyStringParser', () => {
  let parser: KeyStringParser;

  beforeEach(() => {
    parser = new KeyStringParser();
  });

  describe('Constants', () => {
    describe('ALLOWED_KEYS', () => {
      it('should contain all expected key categories', () => {
        // Letters
        expect(ALLOWED_KEYS.has('a')).toBe(true);
        expect(ALLOWED_KEYS.has('z')).toBe(true);

        // Numbers
        expect(ALLOWED_KEYS.has('0')).toBe(true);
        expect(ALLOWED_KEYS.has('9')).toBe(true);

        // Punctuation
        expect(ALLOWED_KEYS.has(',')).toBe(true);
        expect(ALLOWED_KEYS.has('.')).toBe(true);
        expect(ALLOWED_KEYS.has('/')).toBe(true);
        expect(ALLOWED_KEYS.has(';')).toBe(true);
        expect(ALLOWED_KEYS.has("'")).toBe(true);
        expect(ALLOWED_KEYS.has('[')).toBe(true);
        expect(ALLOWED_KEYS.has(']')).toBe(true);
        expect(ALLOWED_KEYS.has('=')).toBe(true);
        expect(ALLOWED_KEYS.has('-')).toBe(true);
        expect(ALLOWED_KEYS.has('\\')).toBe(true);
        expect(ALLOWED_KEYS.has('`')).toBe(true);

        // Arrow keys
        expect(ALLOWED_KEYS.has('left')).toBe(true);
        expect(ALLOWED_KEYS.has('up')).toBe(true);
        expect(ALLOWED_KEYS.has('right')).toBe(true);
        expect(ALLOWED_KEYS.has('down')).toBe(true);

        // Special keys
        expect(ALLOWED_KEYS.has('tab')).toBe(true);
        expect(ALLOWED_KEYS.has('enter')).toBe(true);
        expect(ALLOWED_KEYS.has('escape')).toBe(true);
        expect(ALLOWED_KEYS.has('space')).toBe(true);
        expect(ALLOWED_KEYS.has('backspace')).toBe(true);
        expect(ALLOWED_KEYS.has('delete')).toBe(true);
      });

      it('should not contain disallowed keys', () => {
        // Function keys
        expect(ALLOWED_KEYS.has('f1')).toBe(false);
        expect(ALLOWED_KEYS.has('f12')).toBe(false);

        // Navigation keys
        expect(ALLOWED_KEYS.has('home')).toBe(false);
        expect(ALLOWED_KEYS.has('end')).toBe(false);
        expect(ALLOWED_KEYS.has('pageup')).toBe(false);
        expect(ALLOWED_KEYS.has('pagedown')).toBe(false);

        // Plus key
        expect(ALLOWED_KEYS.has('+')).toBe(false);
        expect(ALLOWED_KEYS.has('plus')).toBe(false);

        // Shifted punctuation
        expect(ALLOWED_KEYS.has('!')).toBe(false);
        expect(ALLOWED_KEYS.has('@')).toBe(false);
        expect(ALLOWED_KEYS.has('#')).toBe(false);

        // Numpad keys
        expect(ALLOWED_KEYS.has('numpad1')).toBe(false);
        expect(ALLOWED_KEYS.has('numpadenter')).toBe(false);
      });
    });

    describe('SEQUENCE_PREFIX', () => {
      it('should only allow g as sequence prefix', () => {
        expect(SEQUENCE_PREFIX.has('g')).toBe(true);
        expect(SEQUENCE_PREFIX.size).toBe(1);
        expect(Array.from(SEQUENCE_PREFIX)).toEqual(['g']);
      });
    });

    describe('VALID_MODIFIER_COMBINATIONS', () => {
      it('should define all valid modifier combinations', () => {
        expect(VALID_MODIFIER_COMBINATIONS).toEqual([
          [], // No modifiers
          ['shift'], // Shift+
          ['alt'], // Alt+
          ['cmd'], // Cmd+
          ['alt', 'shift'], // Alt+Shift+
          ['cmd', 'shift'], // Cmd+Shift+
          ['cmd', 'alt'], // Cmd+Alt+
          ['cmd', 'alt', 'shift'], // Cmd+Alt+Shift+
        ]);
      });
    });

    describe('VALID_MODIFIERS', () => {
      it('should contain all valid modifiers', () => {
        expect(VALID_MODIFIERS.has('cmd')).toBe(true);
        expect(VALID_MODIFIERS.has('alt')).toBe(true);
        expect(VALID_MODIFIERS.has('shift')).toBe(true);
      });

      it('should not contain aliases', () => {
        expect(VALID_MODIFIERS.has('ctrl' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('control' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('meta' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('option' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('win' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('super' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('command' as any)).toBe(false);
        expect(VALID_MODIFIERS.has('opt' as any)).toBe(false);
      });
    });
  });

  describe('Key String Normalization (Mac-Only Registration)', () => {
    it('should normalize basic key combinations', () => {
      expect(parser.normalizeKeyString('cmd+s')).toBe('cmd+s');
      expect(parser.normalizeKeyString('shift+alt+a')).toBe('alt+shift+a');
      expect(parser.normalizeKeyString('alt+enter')).toBe('alt+enter');
    });

    it('should reject modifier aliases and require exact names', () => {
      expect(() => parser.normalizeKeyString('ctrl+s')).toThrow('Invalid key: "ctrl"');
      expect(() => parser.normalizeKeyString('control+s')).toThrow('Invalid key: "control"');
      expect(() => parser.normalizeKeyString('meta+s')).toThrow('Invalid key: "meta"');
      expect(() => parser.normalizeKeyString('win+s')).toThrow('Invalid key: "win"');
      expect(() => parser.normalizeKeyString('super+s')).toThrow('Invalid key: "super"');
      expect(() => parser.normalizeKeyString('command+s')).toThrow('Invalid key: "command"');

      // But exact names should work
      expect(parser.normalizeKeyString('cmd+s')).toBe('cmd+s');
      expect(parser.normalizeKeyString('alt+s')).toBe('alt+s');
      expect(parser.normalizeKeyString('shift+s')).toBe('shift+s');
    });

    it('should handle modifier order consistently', () => {
      expect(parser.normalizeKeyString('shift+alt+cmd+a')).toBe('cmd+alt+shift+a');
      expect(parser.normalizeKeyString('cmd+alt+s')).toBe('cmd+alt+s');
      expect(parser.normalizeKeyString('shift+alt+s')).toBe('alt+shift+s');
    });

    it('should normalize special keys', () => {
      expect(parser.normalizeKeyString('cmd+up')).toBe('cmd+up');
      expect(parser.normalizeKeyString('cmd+down')).toBe('cmd+down');
      expect(parser.normalizeKeyString('cmd+left')).toBe('cmd+left');
      expect(parser.normalizeKeyString('cmd+right')).toBe('cmd+right');
      expect(parser.normalizeKeyString('shift+enter')).toBe('shift+enter');
      expect(parser.normalizeKeyString('cmd+backspace')).toBe('cmd+backspace');
      expect(parser.normalizeKeyString('escape')).toBe('escape');
    });

    it('should handle punctuation keys', () => {
      expect(parser.normalizeKeyString('cmd+,')).toBe('cmd+,');
      expect(parser.normalizeKeyString('shift+.')).toBe('shift+.');
      expect(parser.normalizeKeyString('alt+/')).toBe('alt+/');
      expect(parser.normalizeKeyString('cmd+;')).toBe('cmd+;');
      expect(parser.normalizeKeyString('cmd+\\')).toBe('cmd+\\');
      expect(parser.normalizeKeyString('shift+`')).toBe('shift+`');
    });

    it('should reject function keys', () => {
      expect(() => parser.normalizeKeyString('f1')).toThrow('Invalid key: "f1"');
      expect(() => parser.normalizeKeyString('cmd+f12')).toThrow('Invalid key: "f12"');
      expect(() => parser.normalizeKeyString('shift+f5')).toThrow('Invalid key: "f5"');
    });

    it('should reject navigation keys', () => {
      expect(() => parser.normalizeKeyString('home')).toThrow('Invalid key: "home"');
      expect(() => parser.normalizeKeyString('cmd+end')).toThrow('Invalid key: "end"');
      expect(() => parser.normalizeKeyString('shift+pageup')).toThrow('Invalid key: "pageup"');
      expect(() => parser.normalizeKeyString('alt+pagedown')).toThrow('Invalid key: "pagedown"');
    });

    it('should reject plus key', () => {
      expect(() => parser.normalizeKeyString('cmd++')).toThrow("invalid '+' character placement");
      expect(() => parser.normalizeKeyString('shift++')).toThrow("invalid '+' character placement");
    });

    it('should reject shifted punctuation', () => {
      expect(() => parser.normalizeKeyString('cmd+!')).toThrow('Invalid key: "!"');
      expect(() => parser.normalizeKeyString('alt+@')).toThrow('Invalid key: "@"');
      expect(() => parser.normalizeKeyString('shift+#')).toThrow('Invalid key: "#"');
      expect(() => parser.normalizeKeyString('cmd+$')).toThrow('Invalid key: "$"');
    });

    it('should handle space key variations', () => {
      expect(parser.normalizeKeyString('space')).toBe('space');
      expect(parser.normalizeKeyString('cmd+space')).toBe('cmd+space');
    });

    it('should remove duplicate modifiers', () => {
      expect(parser.normalizeKeyString('cmd+cmd+s')).toBe('cmd+s');
      expect(parser.normalizeKeyString('shift+shift+alt+alt+a')).toBe('alt+shift+a');
    });

    it('should reject alternative modifier names (strict mode)', () => {
      expect(() => parser.normalizeKeyString('control+s')).toThrow('Invalid key: "control"');
      expect(() => parser.normalizeKeyString('option+h')).toThrow('Invalid key: "option"');
      expect(() => parser.normalizeKeyString('command+s')).toThrow('Invalid key: "command"');
      expect(() => parser.normalizeKeyString('meta+s')).toThrow('Invalid key: "meta"');
    });

    it('should reject opt key variations (strict mode)', () => {
      expect(() => parser.normalizeKeyString('opt+h')).toThrow('Invalid key: "opt"');
      expect(() => parser.normalizeKeyString('cmd+opt+s')).toThrow('Invalid key: "opt"');
      expect(() => parser.normalizeKeyString('opt+shift+a')).toThrow('Invalid key: "opt"');
    });

    it('should normalize uppercase keys to lowercase', () => {
      expect(parser.normalizeKeyString('CMD+S')).toBe('cmd+s');
      expect(parser.normalizeKeyString('ALT+ENTER')).toBe('alt+enter');
      expect(parser.normalizeKeyString('CMD+SHIFT+A')).toBe('cmd+shift+a');
    });
  });

  describe('Event Key String Generation with event.code', () => {
    describe('Platform-specific modifier behavior', () => {
      beforeEach(() => {
        // Reset any previous userAgent mocks
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });
      });

      it('should generate key string from keyboard event on Windows/Linux (ctrlKey)', () => {
        // Mock Windows platform
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

      it('should generate key string from keyboard event on Mac (metaKey)', () => {
        // Mock Mac platform
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

      it('should ignore ctrlKey on Mac platform', () => {
        // Mock Mac platform
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

        expect(parser.getEventKeyString(event)).toBe('s'); // No cmd modifier
      });

      it('should ignore metaKey on Windows/Linux platform', () => {
        // Mock Windows platform
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

        expect(parser.getEventKeyString(event)).toBe('s'); // No cmd modifier
      });
    });

    it('should handle plus key problem with event.code', () => {
      const event = new KeyboardEvent('keydown', {
        key: '+',
        code: 'Equal',
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('shift+=');
    });

    it('should handle multiple modifiers with event.code', () => {
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

    it('should handle arrow keys with event.code', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        code: 'ArrowUp',
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('shift+up');
    });

    it('should handle punctuation with event.code', () => {
      const event = new KeyboardEvent('keydown', {
        key: ',',
        code: 'Comma',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('cmd+,');
    });

    it('should handle meta key events on Mac platform', () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });

      expect(parser.getEventKeyString(event)).toBe('cmd+c');
    });

    it('should handle both ctrl and meta keys based on platform', () => {
      // Mock Mac platform - should only use metaKey
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      const macEvent = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });

      expect(parser.getEventKeyString(macEvent)).toBe('cmd+s'); // Uses metaKey on Mac

      // Mock Windows platform - should only use ctrlKey
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      const winEvent = new KeyboardEvent('keydown', {
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });

      expect(parser.getEventKeyString(winEvent)).toBe('cmd+s'); // Uses ctrlKey on Windows
    });

    it('should return empty string for unmapped codes', () => {
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

    it('should handle all mapped punctuation keys', () => {
      const punctuationTests = [
        { code: 'Comma', expected: ',' },
        { code: 'Period', expected: '.' },
        { code: 'Slash', expected: '/' },
        { code: 'Semicolon', expected: ';' },
        { code: 'Quote', expected: "'" },
        { code: 'BracketLeft', expected: '[' },
        { code: 'BracketRight', expected: ']' },
        { code: 'Equal', expected: '=' },
        { code: 'Minus', expected: '-' },
      ];

      punctuationTests.forEach(({ code, expected }) => {
        const event = new KeyboardEvent('keydown', {
          key: 'any',
          code,
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe(`cmd+${expected}`);
      });

      // Test backslash and backtick specifically
      const backslashEvent = new KeyboardEvent('keydown', {
        key: '\\',
        code: 'Backslash',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });
      expect(parser.getEventKeyString(backslashEvent)).toBe('cmd+\\');

      const backtickEvent = new KeyboardEvent('keydown', {
        key: '`',
        code: 'Backquote',
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      });
      expect(parser.getEventKeyString(backtickEvent)).toBe('shift+`');
    });

    it('should handle all letter keys with event.code', () => {
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

      letters.forEach((letter) => {
        const event = new KeyboardEvent('keydown', {
          key: letter.toUpperCase(),
          code: `Key${letter.toUpperCase()}`,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe(letter);
      });
    });

    it('should handle all number keys with event.code', () => {
      for (let i = 0; i <= 9; i++) {
        const event = new KeyboardEvent('keydown', {
          key: i.toString(),
          code: `Digit${i}`,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe(i.toString());
      }
    });
  });

  describe('Key String Validation (3 Shortcut Types)', () => {
    describe('Type 1: Single Key Validation', () => {
      it('should validate single keys without throwing', () => {
        expect(() => parser.normalizeKeyString('a')).not.toThrow();
        expect(() => parser.normalizeKeyString('enter')).not.toThrow();
        expect(() => parser.normalizeKeyString('escape')).not.toThrow();
        expect(() => parser.normalizeKeyString('space')).not.toThrow();
        expect(() => parser.normalizeKeyString('1')).not.toThrow();
      });

      it('should reject invalid single keys', () => {
        expect(() => parser.normalizeKeyString('f1')).toThrow('Invalid key: "f1"');
        expect(() => parser.normalizeKeyString('home')).toThrow('Invalid key: "home"');
        expect(() => parser.normalizeKeyString('!')).toThrow('Invalid key: "!"');
      });
    });

    describe('Type 2: Modifiers + Single Key Validation', () => {
      it('should validate modifier combinations without throwing', () => {
        expect(() => parser.normalizeKeyString('cmd+s')).not.toThrow();
        expect(() => parser.normalizeKeyString('shift+a')).not.toThrow();
        expect(() => parser.normalizeKeyString('cmd+alt+delete')).not.toThrow();
        expect(() => parser.normalizeKeyString('cmd+shift+alt+a')).not.toThrow();
      });

      it('should reject invalid keys in modifier combinations', () => {
        expect(() => parser.normalizeKeyString('cmd+f1')).toThrow('Invalid key: "f1"');
        expect(() => parser.normalizeKeyString('shift+home')).toThrow('Invalid key: "home"');
      });
    });

    describe('Type 3: Two-Key Sequence Validation', () => {
      it('should validate allowed two-key sequences', () => {
        expect(() => parser.normalizeKeyString('g+d')).not.toThrow();
        expect(() => parser.normalizeKeyString('g+a')).not.toThrow();
        expect(() => parser.normalizeKeyString('g+enter')).not.toThrow();
        expect(() => parser.normalizeKeyString('g+space')).not.toThrow();
      });

      it('should reject sequences with invalid prefixes', () => {
        expect(() => parser.normalizeKeyString('a+b')).toThrow(
          'Two-key combinations are only allowed for sequences starting with: g'
        );
        expect(() => parser.normalizeKeyString('h+d')).toThrow(
          'Two-key combinations are only allowed for sequences starting with: g'
        );
        expect(() => parser.normalizeKeyString('x+y')).toThrow(
          'Two-key combinations are only allowed for sequences starting with: g'
        );
      });

      it('should reject two-key sequences with modifiers', () => {
        expect(() => parser.normalizeKeyString('cmd+g+d')).toThrow(
          'Two-key combinations are only allowed for sequences starting with: g'
        );
        expect(() => parser.normalizeKeyString('shift+g+a')).toThrow(
          'Two-key combinations are only allowed for sequences starting with: g'
        );
      });

      it('should reject sequences with invalid second keys', () => {
        expect(() => parser.normalizeKeyString('g+f1')).toThrow('Invalid key: "f1"');
        expect(() => parser.normalizeKeyString('g+home')).toThrow('Invalid key: "home"');
      });
    });

    describe('General Validation Errors', () => {
      it('should throw detailed errors for invalid key strings', () => {
        expect(() => parser.normalizeKeyString('')).toThrow('Key string cannot be empty');
        expect(() => parser.normalizeKeyString('cmd+')).toThrow("invalid '+' character placement");
        expect(() => parser.normalizeKeyString('cmd')).toThrow(
          'Modifier-only shortcuts are not allowed: "cmd". Shortcuts must include at least one non-modifier key.'
        );
        expect(() => parser.normalizeKeyString('shift+alt')).toThrow(
          'Modifier-only shortcuts are not allowed: "shift+alt". Shortcuts must include at least one non-modifier key.'
        );
        expect(() => parser.normalizeKeyString(null as any)).toThrow(
          'Key string cannot be null or undefined'
        );
        expect(() => parser.normalizeKeyString(undefined as any)).toThrow(
          'Key string cannot be null or undefined'
        );
      });

      it('should throw errors for too many keys', () => {
        expect(() => parser.normalizeKeyString('g+d+f')).toThrow(
          'Sequences must have exactly 2 keys'
        );
        expect(() => parser.normalizeKeyString('a+b+c+d')).toThrow(
          'Invalid key combination: too many keys (4)'
        );
      });

      it('should handle malformed plus patterns', () => {
        expect(() => parser.normalizeKeyString('++cmd')).toThrow("invalid '+' character placement");
        expect(() => parser.normalizeKeyString('+cmd+s')).toThrow(
          "invalid '+' character placement"
        );
      });
    });
  });

  describe('Display String Generation', () => {
    it('should generate platform-appropriate display strings on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();

      expect(macParser.getDisplayString('cmd+s')).toBe('⌘S');
      expect(macParser.getDisplayString('shift+enter')).toBe('⇧↵');
      expect(macParser.getDisplayString('alt+backspace')).toBe('⌥⌫');
    });

    it('should generate platform-appropriate display strings on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();

      expect(winParser.getDisplayString('cmd+s')).toBe('Ctrl+S');
      expect(winParser.getDisplayString('shift+enter')).toBe('Shift+↵');
      expect(winParser.getDisplayString('alt+backspace')).toBe('Alt+⌫');
    });

    it('should handle arrow keys with symbols', () => {
      expect(parser.getDisplayString('shift+up')).toMatch(/↑/);
      expect(parser.getDisplayString('cmd+down')).toMatch(/↓/);
      expect(parser.getDisplayString('alt+left')).toMatch(/←/);
      expect(parser.getDisplayString('cmd+right')).toMatch(/→/);
    });
  });

  describe('Edge Cases', () => {
    it('should reject numpad keys', () => {
      expect(() => parser.normalizeKeyString('numpad1')).toThrow('Invalid key: "numpad1"');
      expect(() => parser.normalizeKeyString('numpadenter')).toThrow('Invalid key: "numpadenter"');
      expect(() => parser.normalizeKeyString('numpadadd')).toThrow('Invalid key: "numpadadd"');
    });

    it('should handle case variations with Mac-only registration', () => {
      expect(parser.normalizeKeyString('CMD+SHIFT+A')).toBe('cmd+shift+a');
      expect(parser.normalizeKeyString('cmd+SHIFT+a')).toBe('cmd+shift+a');
      expect(parser.normalizeKeyString('Cmd+Shift+A')).toBe('cmd+shift+a');
    });

    it('should reject whitespace in key strings (strict mode)', () => {
      expect(() => parser.normalizeKeyString(' cmd + s ')).toThrow(
        'Extra spaces and chord sequences are not allowed:'
      );
      expect(() => parser.normalizeKeyString('cmd+ shift +a')).toThrow(
        'Extra spaces and chord sequences are not allowed:'
      );
    });

    it('should handle single character keys', () => {
      expect(parser.normalizeKeyString('A')).toBe('a');
      expect(parser.normalizeKeyString('1')).toBe('1');
      expect(() => parser.normalizeKeyString('!')).toThrow('Invalid key: "!"');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for empty string', () => {
      expect(() => parser.normalizeKeyString('')).toThrow('Key string cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => parser.normalizeKeyString('   ')).toThrow(
        'Key string cannot be whitespace-only'
      );
    });

    it('should throw error for malformed plus patterns', () => {
      expect(() => parser.normalizeKeyString('cmd+++s')).toThrow('invalid consecutive');
      expect(() => parser.normalizeKeyString('cmd++s')).toThrow('invalid consecutive');
      expect(() => parser.normalizeKeyString('+cmd+s')).toThrow("invalid '+' character placement");
      expect(() => parser.normalizeKeyString('cmd+')).toThrow("invalid '+' character placement");
    });

    it('should throw error for spaces and chord sequences', () => {
      expect(() => parser.normalizeKeyString('shift+s cmd')).toThrow(
        'Extra spaces and chord sequences are not allowed'
      );
      expect(() => parser.normalizeKeyString('cmd+a meta')).toThrow(
        'Extra spaces and chord sequences are not allowed'
      );
    });

    it('should allow explicit space key combinations', () => {
      expect(() => parser.normalizeKeyString('cmd+space')).not.toThrow();
      expect(() => parser.normalizeKeyString('shift+space')).not.toThrow();
      expect(() => parser.normalizeKeyString('space')).not.toThrow();
    });

    it('should reject single space character (require explicit "space" string)', () => {
      expect(() => parser.normalizeKeyString(' ')).toThrow(
        'Key string cannot be whitespace-only: " "'
      );
    });

    it('should handle mixed order key combinations', () => {
      expect(parser.normalizeKeyString('s+cmd')).toBe('cmd+s');
      expect(parser.normalizeKeyString('enter+alt')).toBe('alt+enter');
      expect(parser.normalizeKeyString('a+alt+shift+cmd')).toBe('cmd+alt+shift+a');
    });
  });

  describe('Consistency Between Registration and Event Handling', () => {
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
      expect(normalizedString).toBe('cmd+shift+s');
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
      expect(normalizedString).toBe('a');
    });

    it('should handle complex modifier combinations consistently', () => {
      const normalizedString = parser.normalizeKeyString('cmd+alt+shift+a');

      const event = new KeyboardEvent('keydown', {
        key: 'A',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false,
      });
      const eventString = parser.getEventKeyString(event);

      expect(normalizedString).toBe(eventString);
      expect(normalizedString).toBe('cmd+alt+shift+a');
    });
  });

  describe('Cache Functionality', () => {
    it('should cache normalized key strings', () => {
      const keyString = 'cmd+shift+s';
      const result1 = parser.normalizeKeyString(keyString);
      const result2 = parser.normalizeKeyString(keyString);

      expect(result1).toBe(result2);
      expect(result1).toBe('cmd+shift+s');
    });

    it('should clear cache when requested', () => {
      parser.normalizeKeyString('cmd+s');
      expect(() => parser.clearCache()).not.toThrow();
    });
  });
});
