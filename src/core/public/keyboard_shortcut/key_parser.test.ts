/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyStringParser, SPECIAL_KEY_MAPPINGS, MODIFIER_ORDER } from './key_parser';

describe('KeyStringParser', () => {
  let parser: KeyStringParser;

  beforeEach(() => {
    parser = new KeyStringParser();
  });

  describe('Platform Auto-Detection', () => {
    it('should auto-detect platform and normalize keys correctly', () => {
      const autoParser = new KeyStringParser();
      expect(autoParser.normalizeKeyString('ctrl+s')).toBeDefined();
      expect(typeof autoParser.normalizeKeyString('ctrl+s')).toBe('string');
    });
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
    });

    it('should normalize cmd on Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('cmd+shift+enter')).toBe('shift+cmd+enter');
    });

    it('should normalize cmd on Windows/Linux platforms', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('cmd+shift+enter')).toBe('ctrl+shift+enter');
    });

    it('should handle modifier order consistently on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('shift+ctrl+alt+cmd+a')).toBe('alt+shift+cmd+a');
      expect(macParser.normalizeKeyString('cmd+alt+ctrl+s')).toBe('alt+cmd+s');
    });

    it('should handle modifier order consistently on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('shift+ctrl+alt+cmd+a')).toBe('ctrl+alt+shift+a');
      expect(winParser.normalizeKeyString('cmd+alt+ctrl+s')).toBe('ctrl+alt+s');
    });

    it('should normalize special keys', () => {
      expect(parser.normalizeKeyString('Ctrl+ArrowUp')).toBe('ctrl+up');
      expect(parser.normalizeKeyString('Ctrl+ArrowDown')).toBe('ctrl+down');
      expect(parser.normalizeKeyString('Ctrl+ArrowLeft')).toBe('ctrl+left');
      expect(parser.normalizeKeyString('Ctrl+ArrowRight')).toBe('ctrl+right');
      expect(parser.normalizeKeyString('Alt+F1')).toBe('alt+f1');
      expect(parser.normalizeKeyString('Shift+Enter')).toBe('shift+enter');
      expect(parser.normalizeKeyString('Ctrl+Backspace')).toBe('ctrl+backspace');
      expect(parser.normalizeKeyString('Esc')).toBe('escape');
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
      expect(parser.normalizeKeyString('Option+H')).toBe('alt+h');
    });

    it('should handle Meta/Win/Super keys on Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('Meta+A')).toBe('cmd+a');
      expect(macParser.normalizeKeyString('Win+R')).toBe('cmd+r');
      expect(macParser.normalizeKeyString('Super+L')).toBe('cmd+l');
    });

    it('should handle Meta/Win/Super keys on Windows/Linux platforms', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('Meta+A')).toBe('ctrl+a');
      expect(winParser.normalizeKeyString('Win+R')).toBe('ctrl+r');
      expect(winParser.normalizeKeyString('Super+L')).toBe('ctrl+l');
    });

    it('should handle option key variations', () => {
      expect(parser.normalizeKeyString('option+h')).toBe('alt+h');
      expect(parser.normalizeKeyString('Option+H')).toBe('alt+h');
      expect(parser.normalizeKeyString('OPTION+F1')).toBe('alt+f1');
      expect(parser.normalizeKeyString('option+shift+a')).toBe('alt+shift+a');
      expect(parser.normalizeKeyString('ctrl+option+s')).toBe('ctrl+alt+s');
    });

    it('should handle command key variations on Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('command+s')).toBe('cmd+s');
      expect(macParser.normalizeKeyString('Command+S')).toBe('cmd+s');
      expect(macParser.normalizeKeyString('COMMAND+Q')).toBe('cmd+q');
      expect(macParser.normalizeKeyString('shift+command+z')).toBe('shift+cmd+z');
      expect(macParser.normalizeKeyString('command+option+esc')).toBe('alt+cmd+escape');
    });

    it('should handle command key variations on Windows/Linux platforms', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('command+s')).toBe('ctrl+s');
      expect(winParser.normalizeKeyString('Command+S')).toBe('ctrl+s');
      expect(winParser.normalizeKeyString('COMMAND+Q')).toBe('ctrl+q');
      expect(winParser.normalizeKeyString('shift+command+z')).toBe('ctrl+shift+z');
      expect(winParser.normalizeKeyString('command+option+esc')).toBe('ctrl+alt+escape');
    });

    it('should handle opt key variations', () => {
      expect(parser.normalizeKeyString('opt+h')).toBe('alt+h');
      expect(parser.normalizeKeyString('Opt+H')).toBe('alt+h');
      expect(parser.normalizeKeyString('OPT+F1')).toBe('alt+f1');
      expect(parser.normalizeKeyString('ctrl+opt+s')).toBe('ctrl+alt+s');
      expect(parser.normalizeKeyString('opt+shift+a')).toBe('alt+shift+a');
    });

    it('should normalize uppercase keys to lowercase', () => {
      expect(parser.normalizeKeyString('CTRL+S')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('Shift+Alt+F1')).toBe('alt+shift+f1');
      expect(parser.normalizeKeyString('ALT+ENTER')).toBe('alt+enter');
    });

    it('should normalize uppercase CMD on Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('CMD+SHIFT+A')).toBe('shift+cmd+a');
    });

    it('should normalize uppercase CMD on Windows/Linux platforms', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('CMD+SHIFT+A')).toBe('ctrl+shift+a');
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

    it('should handle meta key (cmd) in events on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });
      expect(macParser.getEventKeyString(event)).toBe('cmd+c');
    });

    it('should handle meta key (cmd) in events on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });
      expect(winParser.getEventKeyString(event)).toBe('ctrl+c');
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

    it('should validate two-key sequences without modifiers', () => {
      expect(parser.isValidKeyString('g+d')).toBe(true);
      expect(parser.isValidKeyString('a+b')).toBe(true);
      expect(parser.isValidKeyString('f1+f2')).toBe(true);
      expect(parser.isValidKeyString('enter+space')).toBe(true);
      expect(parser.isValidKeyString('up+down')).toBe(true);
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

    it('should reject three or more key sequences', () => {
      expect(parser.isValidKeyString('g+d+f')).toBe(false);
      expect(parser.isValidKeyString('a+b+c+d')).toBe(false);
      expect(parser.isValidKeyString('f1+f2+f3')).toBe(false);
    });

    it('should reject two-key sequences with modifiers', () => {
      expect(parser.isValidKeyString('ctrl+g+d')).toBe(false);
      expect(parser.isValidKeyString('shift+a+b')).toBe(false);
      expect(parser.isValidKeyString('alt+f1+f2')).toBe(false);
      expect(parser.isValidKeyString('ctrl+shift+g+d')).toBe(false);
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
      expect(SPECIAL_KEY_MAPPINGS.arrowup).toBe('up');
      expect(SPECIAL_KEY_MAPPINGS.arrowdown).toBe('down');
      expect(SPECIAL_KEY_MAPPINGS.arrowleft).toBe('left');
      expect(SPECIAL_KEY_MAPPINGS.arrowright).toBe('right');
    });

    it('should have space key mappings', () => {
      expect(SPECIAL_KEY_MAPPINGS[' ']).toBe('space');
    });

    it('should have escape alias mapping', () => {
      expect(SPECIAL_KEY_MAPPINGS.esc).toBe('escape');
    });
  });

  describe('Modifier Order', () => {
    it('should maintain consistent modifier order', () => {
      expect(MODIFIER_ORDER).toEqual(['ctrl', 'alt', 'shift', 'cmd']);
    });

    it('should apply modifier order in normalization on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('cmd+shift+alt+ctrl+z')).toBe('alt+shift+cmd+z');
    });

    it('should apply modifier order in normalization on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('cmd+shift+alt+ctrl+z')).toBe('ctrl+alt+shift+z');
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
    it('should handle control/ctrl variations', () => {
      expect(parser.normalizeKeyString('control+s')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('ctrl+s')).toBe('ctrl+s');
    });

    it('should handle modifier aliases on Mac platform', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      expect(macParser.normalizeKeyString('meta+s')).toBe('cmd+s');
      expect(macParser.normalizeKeyString('win+s')).toBe('cmd+s');
      expect(macParser.normalizeKeyString('super+s')).toBe('cmd+s');
      expect(macParser.normalizeKeyString('command+s')).toBe('cmd+s');
    });

    it('should handle modifier aliases on Windows/Linux platforms', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      expect(winParser.normalizeKeyString('meta+s')).toBe('ctrl+s');
      expect(winParser.normalizeKeyString('win+s')).toBe('ctrl+s');
      expect(winParser.normalizeKeyString('super+s')).toBe('ctrl+s');
      expect(winParser.normalizeKeyString('command+s')).toBe('ctrl+s');
    });

    it('should handle cross-platform event processing on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });
      expect(macParser.getEventKeyString(event)).toBe('cmd+c');
    });

    it('should handle cross-platform event processing on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      const event = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: true,
      });
      expect(winParser.getEventKeyString(event)).toBe('ctrl+c');
    });

    it('should validate shortcuts consistently', () => {
      expect(parser.isValidKeyString('cmd+c')).toBe(true);
      expect(parser.isValidKeyString('ctrl+c')).toBe(true);
      expect(parser.isValidKeyString('meta+c')).toBe(true);
    });
  });

  describe('Error Handling and Input Validation', () => {
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
      expect(() => parser.normalizeKeyString('ctrl+++s')).toThrow(
        "Malformed key string: invalid consecutive '+' characters (not at end)"
      );

      expect(() => parser.normalizeKeyString('ctrl++s')).toThrow(
        "Malformed key string: invalid consecutive '+' characters (not at end)"
      );

      expect(() => parser.normalizeKeyString('+ctrl+s')).toThrow(
        "Malformed key string: invalid '+' character placement"
      );

      expect(() => parser.normalizeKeyString('ctrl+')).toThrow(
        "Malformed key string: invalid '+' character placement"
      );
    });

    it('should throw error for multiple base keys', () => {
      expect(() => parser.normalizeKeyString('ctrl+a+b')).toThrow(
        'Malformed key string: multiple non-modifier keys with modifiers: "ctrl+a+b"'
      );

      expect(() => parser.normalizeKeyString('shift+enter+space')).toThrow(
        'Malformed key string: multiple non-modifier keys with modifiers: "shift+enter+space"'
      );

      expect(() => parser.normalizeKeyString('ctrl+up+down')).toThrow(
        'Malformed key string: multiple non-modifier keys with modifiers: "ctrl+up+down"'
      );

      expect(() => parser.normalizeKeyString('cmd+comma+period')).toThrow(
        'Malformed key string: multiple non-modifier keys with modifiers: "cmd+comma+period"'
      );
    });

    it('should throw error for chord sequences', () => {
      expect(() => parser.normalizeKeyString('shift+s ctrl')).toThrow(
        'Chord sequences are not supported. Found space in key string: "shift+s ctrl". Use \'+\' to separate simultaneous keys (e.g., "ctrl+shift+s").'
      );

      expect(() => parser.normalizeKeyString('ctrl+a meta')).toThrow(
        'Chord sequences are not supported. Found space in key string: "ctrl+a meta". Use \'+\' to separate simultaneous keys (e.g., "ctrl+shift+s").'
      );

      expect(() => parser.normalizeKeyString('alt f1')).toThrow(
        'Chord sequences are not supported. Found space in key string: "alt f1". Use \'+\' to separate simultaneous keys (e.g., "ctrl+shift+s").'
      );

      expect(() => parser.normalizeKeyString('shift+f ctrl+s')).toThrow(
        'Chord sequences are not supported. Found space in key string: "shift+f ctrl+s". Use \'+\' to separate simultaneous keys (e.g., "ctrl+shift+s").'
      );
    });

    it('should allow valid space key combinations', () => {
      expect(parser.normalizeKeyString('ctrl+ ')).toBe('ctrl+space');
      expect(parser.normalizeKeyString('shift+ ')).toBe('shift+space');
      expect(parser.normalizeKeyString(' ')).toBe('space');
      expect(parser.normalizeKeyString('alt+ ')).toBe('alt+space');
    });

    it('should handle edge cases with spaces correctly', () => {
      expect(() => parser.normalizeKeyString('ctrl+ ')).not.toThrow();
      expect(() => parser.normalizeKeyString('shift+ ')).not.toThrow();

      expect(() => parser.normalizeKeyString('ctrl a')).toThrow(
        'Chord sequences are not supported'
      );
      expect(() => parser.normalizeKeyString('shift+s f1')).toThrow(
        'Chord sequences are not supported'
      );

      expect(() => parser.normalizeKeyString(' ')).not.toThrow();
    });

    it('should handle mixed order key combinations', () => {
      expect(parser.normalizeKeyString('s+ctrl')).toBe('ctrl+s');
      expect(parser.normalizeKeyString('f1+shift')).toBe('shift+f1');
      expect(parser.normalizeKeyString('enter+alt')).toBe('alt+enter');
      expect(parser.normalizeKeyString('f12+shift+ctrl')).toBe('ctrl+shift+f12');
      expect(parser.normalizeKeyString('a+alt+shift+ctrl')).toBe('ctrl+alt+shift+a');

      expect(() => parser.normalizeKeyString('s+ctrl+a')).toThrow(
        'multiple non-modifier keys with modifiers'
      );
      expect(() => parser.normalizeKeyString('f1+s+shift')).toThrow(
        'multiple non-modifier keys with modifiers'
      );

      expect(parser.normalizeKeyString('ctrl+s+shift')).toBe('ctrl+shift+s');
      expect(parser.normalizeKeyString('s+shift+ctrl')).toBe('ctrl+shift+s');
    });

    it('should validate mixed order combinations correctly', () => {
      expect(parser.isValidKeyString('s+ctrl')).toBe(true);
      expect(parser.isValidKeyString('f1+shift')).toBe(true);
      expect(parser.isValidKeyString('enter+alt+ctrl')).toBe(true);
      expect(parser.isValidKeyString('space+cmd+shift')).toBe(true);

      expect(parser.isValidKeyString('f12+shift+ctrl+alt')).toBe(true);
      expect(parser.isValidKeyString('a+alt+shift+ctrl')).toBe(true);

      expect(parser.isValidKeyString('s+ctrl+a')).toBe(false);
      expect(parser.isValidKeyString('f1+s+shift')).toBe(false);

      expect(parser.isValidKeyString('ctrl+shift+alt')).toBe(false);
    });

    it('should normalize mixed order to consistent format', () => {
      expect(parser.normalizeKeyString('ctrl+s')).toBe(parser.normalizeKeyString('s+ctrl'));
      expect(parser.normalizeKeyString('shift+f1')).toBe(parser.normalizeKeyString('f1+shift'));
      expect(parser.normalizeKeyString('ctrl+alt+s')).toBe(parser.normalizeKeyString('s+ctrl+alt'));
      expect(parser.normalizeKeyString('ctrl+alt+s')).toBe(parser.normalizeKeyString('alt+s+ctrl'));
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

      it('should handle cmd++ (cmd + plus key) on Mac', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          configurable: true,
        });
        const macParser = new KeyStringParser();
        expect(macParser.normalizeKeyString('cmd++')).toBe('cmd+plus');
      });

      it('should handle cmd++ (cmd + plus key) on Windows/Linux', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });
        const winParser = new KeyStringParser();
        expect(winParser.normalizeKeyString('cmd++')).toBe('ctrl+plus');
      });

      it('should handle multiple modifiers with plus key', () => {
        expect(parser.normalizeKeyString('ctrl+shift++')).toBe('ctrl+shift+plus');
      });

      it('should handle case variations of plus key', () => {
        expect(parser.normalizeKeyString('CTRL++')).toBe('ctrl+plus');
        expect(parser.normalizeKeyString('Ctrl++')).toBe('ctrl+plus');
      });

      it('should handle plus key with whitespace', () => {
        expect(parser.normalizeKeyString(' ctrl++ ')).toBe('ctrl+plus');
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
      it('should sort modifiers efficiently with Map lookup on Mac', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          configurable: true,
        });
        const macParser = new KeyStringParser();
        expect(macParser.normalizeKeyString('cmd+shift+alt+ctrl+z')).toBe('alt+shift+cmd+z');
        expect(macParser.normalizeKeyString('shift+ctrl+z')).toBe('shift+cmd+z');
        expect(macParser.normalizeKeyString('alt+ctrl+shift+cmd+a')).toBe('alt+shift+cmd+a');
      });

      it('should sort modifiers efficiently with Map lookup on Windows/Linux', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });
        const winParser = new KeyStringParser();
        expect(winParser.normalizeKeyString('cmd+shift+alt+ctrl+z')).toBe('ctrl+alt+shift+z');
        expect(winParser.normalizeKeyString('shift+ctrl+z')).toBe('ctrl+shift+z');
        expect(winParser.normalizeKeyString('alt+ctrl+shift+cmd+a')).toBe('ctrl+alt+shift+a');
      });

      it('should handle unknown modifiers gracefully in sorting', () => {
        expect(parser.normalizeKeyString('ctrl+shift+a')).toBe('ctrl+shift+a');
      });

      it('should maintain consistent order across multiple calls on Mac', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          configurable: true,
        });
        const macParser = new KeyStringParser();
        const input = 'cmd+shift+alt+ctrl+f1';
        const result1 = macParser.normalizeKeyString(input);
        const result2 = macParser.normalizeKeyString(input);
        const result3 = macParser.normalizeKeyString(input);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
        expect(result1).toBe('alt+shift+cmd+f1');
      });

      it('should maintain consistent order across multiple calls on Windows/Linux', () => {
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true,
        });
        const winParser = new KeyStringParser();
        const input = 'cmd+shift+alt+ctrl+f1';
        const result1 = winParser.normalizeKeyString(input);
        const result2 = winParser.normalizeKeyString(input);
        const result3 = winParser.normalizeKeyString(input);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
        expect(result1).toBe('ctrl+alt+shift+f1');
      });
    });
  });

  describe('Code Duplication Elimination', () => {
    describe('buildKeyString Helper Method', () => {
      it('should produce consistent results between normalizeKeyString and getEventKeyString', () => {
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
        const modifierAliases = [
          ['control', 'ctrl'],
          ['meta', 'cmd'],
          ['win', 'cmd'],
          ['super', 'cmd'],
        ];

        modifierAliases.forEach(([alias, expected]) => {
          const result = parser.normalizeKeyString(`${alias}+s`);
          expect(result).toMatch(new RegExp(`${expected === 'cmd' ? '(cmd|ctrl)' : expected}\\+s`));
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

    it('should apply platform mapping correctly on Mac', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      const macParser = new KeyStringParser();
      // @ts-expect-error
      expect(macParser.applyPlatformMapping('ctrl')).toBe('cmd');
      // @ts-expect-error
      expect(macParser.applyPlatformMapping('cmd')).toBe('cmd');
      // @ts-expect-error
      expect(macParser.applyPlatformMapping('alt')).toBe('alt');
      // @ts-expect-error
      expect(macParser.applyPlatformMapping('shift')).toBe('shift');
    });

    it('should apply platform mapping correctly on Windows/Linux', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      const winParser = new KeyStringParser();
      // @ts-expect-error
      expect(winParser.applyPlatformMapping('ctrl')).toBe('ctrl');
      // @ts-expect-error
      expect(winParser.applyPlatformMapping('cmd')).toBe('ctrl');
      // @ts-expect-error
      expect(winParser.applyPlatformMapping('alt')).toBe('alt');
      // @ts-expect-error
      expect(winParser.applyPlatformMapping('shift')).toBe('shift');
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
