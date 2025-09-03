/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive set of keys supported by the keyboard shortcut service.
 */
export const ALLOWED_KEYS = [
  // Letters
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

  // Numbers
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',

  // Punctuation
  ',',
  '-',
  '=',
  '[',
  ']',
  ';',
  "'",
  '.',
  '/',
  '\\',
  '`',

  // Arrow keys
  'left',
  'up',
  'right',
  'down',

  // Special keys
  'tab',
  'enter',
  'escape',
  'space',
  'backspace',
  'delete',
] as const;

/**
 * Allowed prefix keys for two-key sequences.
 *
 * usage patterns:
 * - g+d: Go to Discover
 * - g+v: Go to Visualizations
 * - g+b: Go to Dashboard
 *
 */
export const SEQUENCE_PREFIX = new Set(['g']);

/**
 * Default timeout in milliseconds for sequence key combinations.
 * If the second key is not pressed within this time, the sequence is reset.
 */
export const SEQUENCE_TIMEOUT_MS = 1000;

/**
 * Valid modifier combinations in their canonical order.
 *
 * Each combination is listed in canonical order to ensure consistent normalization
 * regardless of the input order (e.g., "shift+cmd+a" becomes "cmd+shift+a").
 */
export const VALID_MODIFIER_COMBINATIONS = [
  ['shift+'],
  ['alt+'],
  ['cmd+'],
  ['alt+shift+'],
  ['cmd+shift+'],
  ['cmd+alt+'],
  ['cmd+alt+shift+'],
] as const;

/**
 * Maps KeyboardEvent.code values to normalized key names.
 */
export const CODE_TO_KEY_MAPPING: Record<string, string> = {
  // Letters
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',

  // Numbers
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',

  // Punctuation
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Backquote: '`',
  Equal: '=',
  Minus: '-',

  // Arrow keys
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',

  // Special keys
  Space: 'space',
  Tab: 'tab',
  Enter: 'enter',
  Escape: 'escape',
  Backspace: 'backspace',
  Delete: 'delete',
};

/**
 * Platform-specific display representations for keys.
 * Maps key names to their visual representation for each platform.
 *
 * @example
 * // Mac: 'cmd' → '⌘', 'shift' → '⇧', 'up' → '↑'
 * // Windows/Linux: 'cmd' → 'Ctrl', 'shift' → 'Shift', 'up' → '↑'
 */
export const DISPLAY_MAPPINGS = {
  mac: {
    ctrl: '⌃',
    alt: '⌥',
    shift: '⇧',
    cmd: '⌘',
    enter: '↵',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
    escape: 'Esc',
    space: 'Space',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    plus: '+',
  },
  other: {
    ctrl: 'Ctrl',
    alt: 'Alt',
    shift: 'Shift',
    cmd: 'Ctrl',
    enter: '↵',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
    escape: 'Esc',
    space: 'Space',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
    plus: '+',
  },
} as const;
