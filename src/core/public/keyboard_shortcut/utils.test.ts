/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { escapeKey, escapeModifier, VALID_KEY_STRING_REGEX } from './utils';
import { ALLOWED_KEYS, VALID_MODIFIER_COMBINATIONS } from './constants';

describe('Keyboard Shortcut Utils', () => {
  describe('escapeKey', () => {
    it('should escape special regex characters', () => {
      expect(escapeKey('.')).toBe('\\.');
      expect(escapeKey('[')).toBe('\\[');
      expect(escapeKey(']')).toBe('\\]');
      expect(escapeKey('/')).toBe('\\/');
      expect(escapeKey('\\')).toBe('\\\\');
    });

    it('should not escape regular characters', () => {
      expect(escapeKey('a')).toBe('a');
      expect(escapeKey('1')).toBe('1');
      expect(escapeKey('enter')).toBe('enter');
      expect(escapeKey('space')).toBe('space');
      expect(escapeKey(',')).toBe(',');
      expect(escapeKey('-')).toBe('-');
      expect(escapeKey('=')).toBe('=');
      expect(escapeKey(';')).toBe(';');
      expect(escapeKey("'")).toBe("'");
      expect(escapeKey('`')).toBe('`');
    });

    it('should handle empty string', () => {
      expect(escapeKey('')).toBe('');
    });

    it('should handle arrow keys', () => {
      expect(escapeKey('left')).toBe('left');
      expect(escapeKey('up')).toBe('up');
      expect(escapeKey('right')).toBe('right');
      expect(escapeKey('down')).toBe('down');
    });

    it('should handle special keys', () => {
      expect(escapeKey('tab')).toBe('tab');
      expect(escapeKey('enter')).toBe('enter');
      expect(escapeKey('escape')).toBe('escape');
      expect(escapeKey('space')).toBe('space');
      expect(escapeKey('backspace')).toBe('backspace');
      expect(escapeKey('delete')).toBe('delete');
    });
  });

  describe('escapeModifier', () => {
    it('should escape plus characters', () => {
      expect(escapeModifier('shift+')).toBe('shift\\+');
      expect(escapeModifier('cmd+')).toBe('cmd\\+');
      expect(escapeModifier('alt+')).toBe('alt\\+');
      expect(escapeModifier('cmd+shift+')).toBe('cmd\\+shift\\+');
      expect(escapeModifier('cmd+alt+shift+')).toBe('cmd\\+alt\\+shift\\+');
    });

    it('should handle strings without plus characters', () => {
      expect(escapeModifier('shift')).toBe('shift');
      expect(escapeModifier('cmd')).toBe('cmd');
      expect(escapeModifier('alt')).toBe('alt');
    });

    it('should handle empty string', () => {
      expect(escapeModifier('')).toBe('');
    });

    it('should handle multiple plus characters', () => {
      expect(escapeModifier('+++')).toBe('\\+\\+\\+');
      expect(escapeModifier('a+b+c+')).toBe('a\\+b\\+c\\+');
    });
  });

  describe('VALID_KEY_STRING_REGEX', () => {
    describe('valid single keys', () => {
      it('should match all allowed letters', () => {
        const letters = [
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
          'l',
          'm',
          'n',
          'o',
          'p',
          'q',
          'r',
          's',
          't',
          'u',
          'v',
          'w',
          'x',
          'y',
          'z',
        ];
        letters.forEach((letter) => {
          expect(VALID_KEY_STRING_REGEX.test(letter)).toBe(true);
        });
      });

      it('should match all allowed numbers', () => {
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        numbers.forEach((number) => {
          expect(VALID_KEY_STRING_REGEX.test(number)).toBe(true);
        });
      });

      it('should match all allowed punctuation', () => {
        const punctuation = [',', '-', '=', '[', ']', ';', "'", '.', '/', '\\', '`'];
        punctuation.forEach((punct) => {
          expect(VALID_KEY_STRING_REGEX.test(punct)).toBe(true);
        });
      });

      it('should match all allowed arrow keys', () => {
        const arrows = ['left', 'up', 'right', 'down'];
        arrows.forEach((arrow) => {
          expect(VALID_KEY_STRING_REGEX.test(arrow)).toBe(true);
        });
      });

      it('should match all allowed special keys', () => {
        const special = ['tab', 'enter', 'escape', 'space', 'backspace', 'delete'];
        special.forEach((key) => {
          expect(VALID_KEY_STRING_REGEX.test(key)).toBe(true);
        });
      });
    });

    describe('valid modifier combinations with keys', () => {
      it('should match all valid modifier combinations with each allowed key', () => {
        const testKeys = ['a', 's', '1', 'enter', 'space', '.', '[', '/'];

        VALID_MODIFIER_COMBINATIONS.forEach((modifierCombo) => {
          const modifierString = modifierCombo.join('');
          testKeys.forEach((key) => {
            const keyString = `${modifierString}${key}`;
            expect(VALID_KEY_STRING_REGEX.test(keyString)).toBe(true);
          });
        });
      });

      it('should match specific valid combinations', () => {
        const validCombinations = [
          'shift+a',
          'alt+s',
          'cmd+c',
          'alt+shift+d',
          'cmd+shift+s',
          'cmd+alt+a',
          'cmd+alt+shift+z',
          'shift+enter',
          'alt+space',
          'cmd+.',
          'cmd+shift+/',
          'alt+shift+[',
          'cmd+alt+]',
        ];

        validCombinations.forEach((combo) => {
          expect(VALID_KEY_STRING_REGEX.test(combo)).toBe(true);
        });
      });
    });

    describe('invalid key strings', () => {
      it('should reject invalid single keys', () => {
        const invalidKeys = [
          'f1',
          'f2',
          'ctrl',
          'meta',
          'win',
          'home',
          'end',
          'pageup',
          'pagedown',
          'insert',
        ];
        invalidKeys.forEach((key) => {
          expect(VALID_KEY_STRING_REGEX.test(key)).toBe(false);
        });
      });

      it('should reject invalid modifier combinations', () => {
        const invalidModifiers = [
          'ctrl+a',
          'meta+s',
          'win+d',
          'shift+alt+a',
          'alt+cmd+s',
          'shift+cmd+alt+a',
          'invalid+a',
        ];

        invalidModifiers.forEach((combo) => {
          expect(VALID_KEY_STRING_REGEX.test(combo)).toBe(false);
        });
      });

      it('should reject malformed strings', () => {
        const malformed = [
          '',
          '+',
          'a+',
          '+a',
          'cmd++a',
          'cmd+',
          'shift++',
          'a+b+c',
          'cmd+shift+alt+ctrl+a',
        ];

        malformed.forEach((str) => {
          expect(VALID_KEY_STRING_REGEX.test(str)).toBe(false);
        });
      });

      it('should reject strings with spaces', () => {
        const withSpaces = ['cmd + a', ' cmd+a', 'cmd+a ', 'cmd +a', 'cmd+ a'];

        withSpaces.forEach((str) => {
          expect(VALID_KEY_STRING_REGEX.test(str)).toBe(false);
        });
      });

      it('should reject uppercase variations', () => {
        const uppercase = ['CMD+a', 'ALT+s', 'SHIFT+d', 'cmd+A', 'alt+S', 'ENTER', 'SPACE'];

        uppercase.forEach((str) => {
          expect(VALID_KEY_STRING_REGEX.test(str)).toBe(false);
        });
      });
    });

    describe('comprehensive testing with all combinations', () => {
      it('should validate all modifier combinations with all allowed keys', () => {
        let validCount = 0;
        let totalTests = 0;

        VALID_MODIFIER_COMBINATIONS.forEach((modifierCombo) => {
          const modifierString = modifierCombo.join('');

          ALLOWED_KEYS.forEach((key) => {
            const keyString = `${modifierString}${key}`;
            totalTests++;

            if (VALID_KEY_STRING_REGEX.test(keyString)) {
              validCount++;
            }
          });
        });

        ALLOWED_KEYS.forEach((key) => {
          totalTests++;
          if (VALID_KEY_STRING_REGEX.test(key)) {
            validCount++;
          }
        });

        expect(validCount).toBe(totalTests);

        const expectedTests =
          VALID_MODIFIER_COMBINATIONS.length * ALLOWED_KEYS.length + ALLOWED_KEYS.length;
        expect(totalTests).toBe(expectedTests);
      });

      it('should reject a sample of invalid combinations', () => {
        const invalidSamples = [
          'invalid+a',
          'ctrl+s',
          'meta+d',
          'f1',
          'home',
          'end',
          '',
          '+',
          'cmd+',
          '+a',
          'cmd++a',
        ];

        invalidSamples.forEach((invalid) => {
          expect(VALID_KEY_STRING_REGEX.test(invalid)).toBe(false);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle special regex characters in keys correctly', () => {
        expect(VALID_KEY_STRING_REGEX.test('.')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('[')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test(']')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('/')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('\\')).toBe(true);

        expect(VALID_KEY_STRING_REGEX.test('cmd+.')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('alt+[')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('cmd+shift+]')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('shift+/')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('cmd+alt+\\')).toBe(true);
      });

      it('should handle plus characters in modifiers correctly', () => {
        expect(VALID_KEY_STRING_REGEX.test('shift+a')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('alt+shift+b')).toBe(true);
        expect(VALID_KEY_STRING_REGEX.test('cmd+alt+shift+c')).toBe(true);
      });
    });
  });
});
