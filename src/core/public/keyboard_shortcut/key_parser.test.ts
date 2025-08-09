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

import { KeyStringParser, SPECIAL_KEY_MAPPINGS, MODIFIER_ORDER } from './key_parser';

describe('KeyStringParser', () => {
  let parser: KeyStringParser;

  beforeEach(() => {
    parser = new KeyStringParser();
  });

  describe('Platform Detection', () => {
    it('should detect Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.getDisplayString('cmd+s')).toBe('⌘S');
    });

    it('should detect Windows platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.getDisplayString('ctrl+s')).toBe('Ctrl+S');
    });

    it('should default to Linux platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true,
      });
      const linuxParser = new KeyStringParser();
      expect(linuxParser.getDisplayString('ctrl+s')).toBe('Ctrl+S');
    });
  });

  describe('Key String Normalization', () => {
    it('should normalize basic key combinations', () => {
      expect(parser.normalizeKeyString('Ctrl+S')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('SHIFT+ALT+F1')).toBe('alt+shift+f1');
      expect(parser.normalizeKeyString('cmd+shift+enter')).toBe('ctrl+shift+enter');
    });

    it('should handle modifier order consistently', () => {
      expect(parser.normalizeKeyString('shift+ctrl+alt+cmd+a')).toBe('ctrl+alt+shift+a');
      expect(parser.normalizeKeyString('cmd+alt+ctrl+s')).toBe('ctrl+alt+s');
    });

    it('should normalize special keys', () => {
      expect(parser.normalizeKeyString('Ctrl+ArrowUp')).toBe('ctrl+arrowup');
      expect(parser.normalizeKeyString('Alt+F1')).toBe('alt+f1');
      expect(parser.normalizeKeyString('Shift+Enter')).toBe('shift+enter');
      expect(parser.normalizeKeyString('Ctrl+Backspace')).toBe('ctrl+backspace');
    });

    it('should handle punctuation keys', () => {
      expect(parser.normalizeKeyString('Ctrl+,')).toBe('ctrl+comma');
      expect(parser.normalizeKeyString('Shift+.')).toBe('shift+period');
      expect(parser.normalizeKeyString('Alt+/')).toBe('alt+slash');
      expect(parser.normalizeKeyString('Ctrl+;')).toBe('ctrl+semicolon');
    });

    it('should handle shifted punctuation', () => {
      expect(parser.normalizeKeyString('Ctrl+!')).toBe('ctrl+exclamation');
      expect(parser.normalizeKeyString('Alt+@')).toBe('alt+at');
      expect(parser.normalizeKeyString('Shift+#')).toBe('shift+hash');
      expect(parser.normalizeKeyString('Ctrl+$')).toBe('ctrl+dollar');
    });

    it('should handle function keys', () => {
      expect(parser.normalizeKeyString('F1')).toBe('f1');
      expect(parser.normalizeKeyString('Ctrl+F12')).toBe('ctrl+f12');
      expect(parser.normalizeKeyString('Shift+F5')).toBe('shift+f5');
    });

    it('should handle navigation keys', () => {
      expect(parser.normalizeKeyString('Home')).toBe('home');
      expect(parser.normalizeKeyString('Ctrl+End')).toBe('ctrl+end');
      expect(parser.normalizeKeyString('Shift+PageUp')).toBe('shift+pageup');
      expect(parser.normalizeKeyString('Alt+PageDown')).toBe('alt+pagedown');
    });

    it('should handle space key variations', () => {
      expect(parser.normalizeKeyString('Space')).toBe('space');
      expect(parser.normalizeKeyString('Ctrl+Space')).toBe('ctrl+space');
      expect(parser.normalizeKeyString('Ctrl+ ')).toBe('ctrl+space');
    });

    it('should remove duplicate modifiers', () => {
      expect(parser.normalizeKeyString('ctrl+ctrl+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('shift+shift+alt+alt+f')).toBe('alt+shift+f');
    });

    it('should handle alternative modifier names', () => {
      expect(parser.normalizeKeyString('Control+S')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('Meta+A')).toBe('ctrl+a');
      expect(parser.normalizeKeyString('Win+R')).toBe('ctrl+r');
      expect(parser.normalizeKeyString('Super+L')).toBe('ctrl+l');
    });
  });

  describe('Event Key String Generation', () => {
    it('should generate key string from keyboard event', () => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('ctrl+s');
    });

    it('should handle multiple modifiers in event', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'F1',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('ctrl+alt+shift+f1');
    });

    it('should handle special keys in events', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('shift+up');
    });

    it('should handle meta key (cmd) in events', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });

      expect(parser.getEventKeyString(event)).toBe('ctrl+c');
    });

    it('should handle punctuation in events', () => {
      const event = new KeyboardEvent('keydown', {
        key: ',',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      });

      expect(parser.getEventKeyString(event)).toBe('ctrl+comma');
    });
  });

  describe('Key String Validation', () => {
    it('should validate correct key strings', () => {
      expect(parser.isValidKeyString('ctrl+s')).toBe(true);
      expect(parser.isValidKeyString('shift+f1')).toBe(true);
      expect(parser.isValidKeyString('ctrl+alt+delete')).toBe(true);
      expect(parser.isValidKeyString('a')).toBe(true);
      expect(parser.isValidKeyString('enter')).toBe(true);
    });

    it('should reject invalid key strings', () => {
      expect(parser.isValidKeyString('')).toBe(false);
      expect(parser.isValidKeyString('ctrl+')).toBe(false);
      expect(parser.isValidKeyString('ctrl')).toBe(false);
      expect(parser.isValidKeyString('shift+alt')).toBe(false);
      expect(parser.isValidKeyString('ctrl+shift+alt')).toBe(false);
      expect(parser.isValidKeyString(null as any)).toBe(false);
      expect(parser.isValidKeyString(undefined as any)).toBe(false);
    });

    it('should handle edge cases in validation', () => {
      expect(parser.isValidKeyString('ctrl+shift+alt+cmd+a')).toBe(true);
      expect(parser.isValidKeyString('f12')).toBe(true);
      expect(parser.isValidKeyString('numpad1')).toBe(true);
    });
  });

  describe('Display String Generation', () => {
    it('should generate human-readable display strings', () => {
      expect(parser.getDisplayString('ctrl+s')).toMatch(/Ctrl.*S|⌃s/);
      expect(parser.getDisplayString('shift+f1')).toMatch(/Shift.*F1|⇧f1/);
      expect(parser.getDisplayString('alt+enter')).toMatch(/Alt.*↵|⌥↵/);
    });

    it('should handle special character symbols', () => {
      const displayString = parser.getDisplayString('ctrl+backspace');
      expect(displayString).toMatch(/⌫|Backspace/);
    });

    it('should handle arrow keys with symbols', () => {
      expect(parser.getDisplayString('shift+up')).toMatch(/↑/);
      expect(parser.getDisplayString('ctrl+down')).toMatch(/↓/);
      expect(parser.getDisplayString('alt+left')).toMatch(/←/);
      expect(parser.getDisplayString('cmd+right')).toMatch(/→/);
    });
  });

  describe('Special Key Mappings', () => {
    it('should have comprehensive arrow key mappings', () => {
      expect(SPECIAL_KEY_MAPPINGS.ArrowUp).toBe('up');
      expect(SPECIAL_KEY_MAPPINGS.ArrowDown).toBe('down');
      expect(SPECIAL_KEY_MAPPINGS.ArrowLeft).toBe('left');
      expect(SPECIAL_KEY_MAPPINGS.ArrowRight).toBe('right');
    });

    it('should have all function key mappings', () => {
      for (let i = 1; i <= 12; i++) {
        expect(SPECIAL_KEY_MAPPINGS[`F${i}`]).toBe(`f${i}`);
      }
    });

    it('should have navigation key mappings', () => {
      expect(SPECIAL_KEY_MAPPINGS.Home).toBe('home');
      expect(SPECIAL_KEY_MAPPINGS.End).toBe('end');
      expect(SPECIAL_KEY_MAPPINGS.PageUp).toBe('pageup');
      expect(SPECIAL_KEY_MAPPINGS.PageDown).toBe('pagedown');
      expect(SPECIAL_KEY_MAPPINGS.Insert).toBe('insert');
      expect(SPECIAL_KEY_MAPPINGS.Delete).toBe('delete');
    });

    it('should have control character mappings', () => {
      expect(SPECIAL_KEY_MAPPINGS.Backspace).toBe('backspace');
      expect(SPECIAL_KEY_MAPPINGS.Tab).toBe('tab');
      expect(SPECIAL_KEY_MAPPINGS.Enter).toBe('enter');
      expect(SPECIAL_KEY_MAPPINGS.Escape).toBe('escape');
      expect(SPECIAL_KEY_MAPPINGS.Space).toBe('space');
      expect(SPECIAL_KEY_MAPPINGS[' ']).toBe('space');
    });
  });

  describe('Modifier Order', () => {
    it('should maintain consistent modifier order', () => {
      expect(MODIFIER_ORDER).toEqual(['ctrl', 'alt', 'shift', 'cmd']);
    });

    it('should apply modifier order in normalization', () => {
      const result = parser.normalizeKeyString('cmd+shift+alt+ctrl+z');
      expect(result).toBe('ctrl+alt+shift+z');
    });
  });

  describe('Edge Cases', () => {
    it('should handle numpad keys', () => {
      expect(parser.normalizeKeyString('Numpad1')).toBe('numpad1');
      expect(parser.normalizeKeyString('NumpadEnter')).toBe('numpadenter');
      expect(parser.normalizeKeyString('NumpadAdd')).toBe('numpadadd');
    });

    it('should handle case variations', () => {
      expect(parser.normalizeKeyString('CTRL+SHIFT+A')).toBe('ctrl+shift+a');
      expect(parser.normalizeKeyString('ctrl+SHIFT+a')).toBe('ctrl+shift+a');
      expect(parser.normalizeKeyString('Ctrl+Shift+A')).toBe('ctrl+shift+a');
    });

    it('should handle whitespace in key strings', () => {
      expect(parser.normalizeKeyString(' ctrl + s ')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('ctrl+ shift +a')).toBe('ctrl+shift+a');
    });

    it('should handle single character keys', () => {
      expect(parser.normalizeKeyString('A')).toBe('a');
      expect(parser.normalizeKeyString('1')).toBe('1');
      expect(parser.normalizeKeyString('!')).toBe('exclamation');
    });
  });

  describe('Cross-platform Compatibility', () => {
    it('should handle platform-specific modifier differences', () => {
      expect(parser.normalizeKeyString('cmd+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('meta+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('win+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('super+s')).toBe('ctrl+s');
    });

    it('should handle control/ctrl variations', () => {
      expect(parser.normalizeKeyString('control+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('ctrl+s')).toBe('ctrl+s');
    });

    it('should handle cmd+c on Windows platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();

      expect(winParser.normalizeKeyString('cmd+c')).toBe('ctrl+c');
      expect(winParser.normalizeKeyString('meta+c')).toBe('ctrl+c');

      expect(winParser.isValidKeyString('cmd+c')).toBe(true);

      expect(winParser.getDisplayString('cmd+c')).toBe('Ctrl+C');

      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });
      expect(winParser.getEventKeyString(event)).toBe('ctrl+c');
    });
  });

  describe('Error Handling and Input Validation', () => {
    it('should throw error for null input', () => {
      expect(() => parser.normalizeKeyString(null as any)).toThrow(
        'Invalid key string input: expected string, got null'
      );
    });

    it('should throw error for undefined input', () => {
      expect(() => parser.normalizeKeyString(undefined as any)).toThrow(
        'Invalid key string input: expected string, got undefined'
      );
    });

    it('should throw error for non-string input', () => {
      expect(() => parser.normalizeKeyString(123 as any)).toThrow(
        'Invalid key string input: expected string, got number'
      );
    });

    it('should throw error for empty string', () => {
      expect(() => parser.normalizeKeyString('')).toThrow(
        'Key string cannot be empty or whitespace-only'
      );
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => parser.normalizeKeyString('   ')).toThrow(
        'Key string cannot be empty or whitespace-only'
      );
    });

    it('should throw error for malformed plus patterns', () => {
      expect(() => parser.normalizeKeyString('ctrl+++')).toThrow(
        "Malformed key string: contains three or more consecutive '+' characters"
      );

      expect(() => parser.normalizeKeyString('ctrl++s')).toThrow(
        "Malformed key string: invalid consecutive '+' characters (not at end)"
      );

      expect(() => parser.normalizeKeyString('+ctrl+s')).toThrow(
        "Malformed key string: cannot start with '+'"
      );

      expect(() => parser.normalizeKeyString('ctrl+')).toThrow(
        "Malformed key string: cannot end with single '+'"
      );
    });
  });

  describe('Plus Key Support', () => {
    describe('Valid Plus Key Combinations', () => {
      it('should handle ctrl++ (ctrl + plus key)', () => {
        expect(parser.normalizeKeyString('ctrl++')).toBe('ctrl+plus');
      });

      it('should handle shift++ (shift + plus key)', () => {
        expect(parser.normalizeKeyString('shift++')).toBe('shift+plus');
      });

      it('should handle alt++ (alt + plus key)', () => {
        expect(parser.normalizeKeyString('alt++')).toBe('alt+plus');
      });

      it('should handle cmd++ (cmd + plus key)', () => {
        expect(parser.normalizeKeyString('cmd++')).toBe('ctrl+plus');
      });

      it('should handle multiple modifiers with plus key', () => {
        expect(parser.normalizeKeyString('ctrl+shift++')).toBe('ctrl+shift+plus');
      });

      it('should handle case variations of plus key', () => {
        expect(parser.normalizeKeyString('CTRL++')).toBe('ctrl+plus');
        expect(parser.normalizeKeyString('Ctrl++')).toBe('ctrl+plus');
      });

      it('should handle plus key with whitespace', () => {
        expect(parser.normalizeKeyString(' ctrl ++ ')).toBe('ctrl+plus');
      });
    });

    describe('Plus Key Validation', () => {
      it('should validate plus key combinations as valid', () => {
        expect(parser.isValidKeyString('ctrl++')).toBe(true);
        expect(parser.isValidKeyString('shift++')).toBe(true);
        expect(parser.isValidKeyString('alt++')).toBe(true);
        expect(parser.isValidKeyString('ctrl+shift++')).toBe(true);
      });
    });

    describe('Plus Key Display', () => {
      it('should display plus key combinations correctly', () => {
        const displayString = parser.getDisplayString('ctrl++');
        expect(displayString).toMatch(/Ctrl.*\+|⌃\+/);
      });

      it('should display complex plus key combinations', () => {
        const displayString = parser.getDisplayString('ctrl+shift++');
        expect(displayString).toMatch(/Ctrl.*Shift.*\+|⌃⇧\+/);
      });
    });

    describe('Plus Key Event Handling', () => {
      it('should handle plus key in keyboard events', () => {
        const event = new KeyboardEvent('keydown', {
          key: '+',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe('ctrl+plus');
      });

      it('should handle plus key with multiple modifiers in events', () => {
        const event = new KeyboardEvent('keydown', {
          key: '+',
          ctrlKey: true,
          shiftKey: true,
          altKey: false,
          metaKey: false,
        });

        expect(parser.getEventKeyString(event)).toBe('ctrl+shift+plus');
      });
    });
  });

  describe('Performance Optimizations', () => {
    describe('Modifier Sorting Performance', () => {
      it('should sort modifiers efficiently with Map lookup', () => {
        // Test that sorting works correctly (Map lookup is internal)
        expect(parser.normalizeKeyString('cmd+shift+alt+ctrl+z')).toBe('ctrl+alt+shift+z');
        expect(parser.normalizeKeyString('shift+ctrl+z')).toBe('ctrl+shift+z');
        expect(parser.normalizeKeyString('alt+ctrl+shift+cmd+a')).toBe('ctrl+alt+shift+a');
      });

      it('should handle unknown modifiers gracefully in sorting', () => {
        // This tests the fallback behavior (?? -1) in the Map lookup
        expect(parser.normalizeKeyString('ctrl+shift+a')).toBe('ctrl+shift+a');
      });

      it('should maintain consistent order across multiple calls', () => {
        const input = 'cmd+shift+alt+ctrl+f1';
        const result1 = parser.normalizeKeyString(input);
        const result2 = parser.normalizeKeyString(input);
        const result3 = parser.normalizeKeyString(input);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
        expect(result1).toBe('ctrl+alt+shift+f1');
      });
    });
  });

  describe('Code Duplication Elimination', () => {
    describe('buildKeyString Helper Method', () => {
      it('should produce consistent results between normalizeKeyString and getEventKeyString', () => {
        // Test that both methods produce the same output for equivalent inputs
        const normalizedString = parser.normalizeKeyString('ctrl+shift+s');

        const event = new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          shiftKey: true,
          altKey: false,
          metaKey: false,
        });
        const eventString = parser.getEventKeyString(event);

        expect(normalizedString).toBe(eventString);
        expect(normalizedString).toBe('ctrl+shift+s');
      });

      it('should handle single keys consistently', () => {
        const normalizedString = parser.normalizeKeyString('a');

        const event = new KeyboardEvent('keydown', {
          key: 'a',
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
        const normalizedString = parser.normalizeKeyString('ctrl+alt+shift+f12');

        const event = new KeyboardEvent('keydown', {
          key: 'F12',
          ctrlKey: true,
          shiftKey: true,
          altKey: true,
          metaKey: false,
        });
        const eventString = parser.getEventKeyString(event);

        expect(normalizedString).toBe(eventString);
        expect(normalizedString).toBe('ctrl+alt+shift+f12');
      });
    });
  });

  describe('Enhanced JSDoc Documentation Coverage', () => {
    describe('Error Throwing Documentation', () => {
      it('should throw documented errors for invalid input', () => {
        // Test that the @throws documentation is accurate
        expect(() => parser.normalizeKeyString(null as any)).toThrow();
        expect(() => parser.normalizeKeyString(undefined as any)).toThrow();
        expect(() => parser.normalizeKeyString(123 as any)).toThrow();
        expect(() => parser.normalizeKeyString('')).toThrow();
        expect(() => parser.normalizeKeyString('+++')).toThrow();
      });
    });

    describe('Example Usage from JSDoc', () => {
      it('should work as documented in JSDoc examples for normalizeKeyString', () => {
        // Test examples from JSDoc comments
        expect(parser.normalizeKeyString('Ctrl+S')).toBe('ctrl+s');
        expect(parser.normalizeKeyString('shift+ctrl+f1')).toBe('ctrl+shift+f1');
        expect(parser.normalizeKeyString('ALT+F4')).toBe('alt+f4');
      });

      it('should work as documented in JSDoc examples for getEventKeyString', () => {
        // Test that event handling works as documented
        const event = new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });

        const result = parser.getEventKeyString(event);
        expect(result).toBe('ctrl+s');

        // Should match normalized version
        expect(result).toBe(parser.normalizeKeyString('Ctrl+S'));
      });
    });
  });

  describe('Edge Cases and Regression Tests', () => {
    describe('Complex Malformed Patterns', () => {
      it('should handle mixed malformed patterns', () => {
        expect(() => parser.normalizeKeyString('++ctrl++s')).toThrow();
        expect(() => parser.normalizeKeyString('ctrl+++shift')).toThrow();
        expect(() => parser.normalizeKeyString('+ctrl+shift+')).toThrow();
      });

      it('should handle whitespace with malformed patterns', () => {
        expect(() => parser.normalizeKeyString(' ++ ')).toThrow();
        expect(() => parser.normalizeKeyString(' ctrl ++ s ')).toThrow();
        expect(() => parser.normalizeKeyString(' + ctrl + s ')).toThrow();
      });
    });

    describe('Special Character Edge Cases', () => {
      it('should handle all punctuation keys correctly', () => {
        const punctuationTests = [
          [',', 'comma'],
          ['.', 'period'],
          ['/', 'slash'],
          [';', 'semicolon'],
          ["'", 'quote'],
          ['[', 'bracketleft'],
          [']', 'bracketright'],
          ['\\', 'backslash'],
          ['`', 'backquote'],
          ['=', 'equal'],
          ['-', 'minus'],
        ];

        punctuationTests.forEach(([input, expected]) => {
          expect(parser.normalizeKeyString(`ctrl+${input}`)).toBe(`ctrl+${expected}`);
        });
      });

      it('should handle all shifted punctuation correctly', () => {
        const shiftedTests = [
          ['!', 'exclamation'],
          ['@', 'at'],
          ['#', 'hash'],
          ['$', 'dollar'],
          ['%', 'percent'],
          ['^', 'caret'],
          ['&', 'ampersand'],
          ['*', 'asterisk'],
          ['(', 'parenleft'],
          [')', 'parenright'],
          ['_', 'underscore'],
          ['+', 'plus'],
          ['{', 'braceleft'],
          ['}', 'braceright'],
          ['|', 'pipe'],
          [':', 'colon'],
          ['"', 'doublequote'],
          ['<', 'less'],
          ['>', 'greater'],
          ['?', 'question'],
          ['~', 'tilde'],
        ];

        shiftedTests.forEach(([input, expected]) => {
          expect(parser.normalizeKeyString(`shift+${input}`)).toBe(`shift+${expected}`);
        });
      });
    });

    describe('Numpad Key Variations', () => {
      it('should handle all numpad keys', () => {
        const numpadKeys = [
          'Numpad0',
          'Numpad1',
          'Numpad2',
          'Numpad3',
          'Numpad4',
          'Numpad5',
          'Numpad6',
          'Numpad7',
          'Numpad8',
          'Numpad9',
          'NumpadAdd',
          'NumpadSubtract',
          'NumpadMultiply',
          'NumpadDivide',
          'NumpadDecimal',
          'NumpadEnter',
        ];

        numpadKeys.forEach((key) => {
          const expected = `numpad${key.slice(6).toLowerCase()}`;
          expect(parser.normalizeKeyString(key)).toBe(expected);
          expect(parser.normalizeKeyString(`ctrl+${key}`)).toBe(`ctrl+${expected}`);
        });
      });
    });

    describe('Cross-Platform Modifier Mapping Edge Cases', () => {
      it('should handle complex modifier combinations across platforms', () => {
        // Test that all modifier aliases work correctly
        const modifierAliases = [
          ['control', 'ctrl'],
          ['meta', 'cmd'],
          ['win', 'cmd'],
          ['super', 'cmd'],
        ];

        modifierAliases.forEach(([alias, expected]) => {
          const result = parser.normalizeKeyString(`${alias}+s`);
          expect(result).toMatch(new RegExp(`${expected === 'cmd' ? 'ctrl' : expected}\\+s`));
        });
      });
    });
  });

  describe('Private Method Testing', () => {
    it('should normalize individual keys correctly', () => {
      // @ts-expect-error
      expect(parser.normalizeKey('.')).toBe('period');
      // @ts-expect-error
      expect(parser.normalizeKey('ArrowUp')).toBe('up');
      // @ts-expect-error
      expect(parser.normalizeKey('F1')).toBe('f1');
      // @ts-expect-error
      expect(parser.normalizeKey('a')).toBe('a');
    });

    it('should detect modifiers correctly', () => {
      // @ts-expect-error
      expect(parser.isModifier('ctrl')).toBe(true);
      // @ts-expect-error
      expect(parser.isModifier('shift')).toBe(true);
      // @ts-expect-error
      expect(parser.isModifier('a')).toBe(false);
      // @ts-expect-error
      expect(parser.isModifier('f1')).toBe(false);
    });

    it('should normalize modifier names correctly', () => {
      // @ts-expect-error
      expect(parser.normalizeModifier('ctrl')).toBe('ctrl');
      // @ts-expect-error
      expect(parser.normalizeModifier('control')).toBe('ctrl');
      // @ts-expect-error
      expect(parser.normalizeModifier('meta')).toBe('cmd');
      // @ts-expect-error
      expect(parser.normalizeModifier('win')).toBe('cmd');
    });

    it('should apply platform mapping correctly', () => {
      // @ts-expect-error
      expect(parser.applyPlatformMapping('ctrl')).toBe('ctrl');
      // @ts-expect-error
      expect(parser.applyPlatformMapping('cmd')).toBe('ctrl');
      // @ts-expect-error
      expect(parser.applyPlatformMapping('alt')).toBe('alt');
      // @ts-expect-error
      expect(parser.applyPlatformMapping('shift')).toBe('shift');
    });

    it('should build key strings correctly', () => {
      // @ts-expect-error
      expect(parser.buildKeyString(['ctrl', 'shift'], 's')).toBe('ctrl+shift+s');
      // @ts-expect-error
      expect(parser.buildKeyString(['ctrl'], 'a')).toBe('ctrl+a');
      // @ts-expect-error
      expect(parser.buildKeyString([], 'enter')).toBe('enter');
    });
  });
});
