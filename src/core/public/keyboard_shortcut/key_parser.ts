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

/**
 * Special key mappings for cross-platform compatibility
 * Maps browser event.key values to normalized key names
 */
export const SPECIAL_KEY_MAPPINGS: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',

  F1: 'f1',
  F2: 'f2',
  F3: 'f3',
  F4: 'f4',
  F5: 'f5',
  F6: 'f6',
  F7: 'f7',
  F8: 'f8',
  F9: 'f9',
  F10: 'f10',
  F11: 'f11',
  F12: 'f12',

  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  Insert: 'insert',
  Delete: 'delete',

  Backspace: 'backspace',
  Tab: 'tab',
  Enter: 'enter',
  Escape: 'escape',
  Space: 'space',
  ' ': 'space',

  ',': 'comma',
  '.': 'period',
  '/': 'slash',
  ';': 'semicolon',
  "'": 'quote',
  '[': 'bracketleft',
  ']': 'bracketright',
  '\\': 'backslash',
  '`': 'backquote',
  '=': 'equal',
  '-': 'minus',

  '!': 'exclamation',
  '@': 'at',
  '#': 'hash',
  $: 'dollar',
  '%': 'percent',
  '^': 'caret',
  '&': 'ampersand',
  '*': 'asterisk',
  '(': 'parenleft',
  ')': 'parenright',
  _: 'underscore',
  '+': 'plus',
  '{': 'braceleft',
  '}': 'braceright',
  '|': 'pipe',
  ':': 'colon',
  '"': 'doublequote',
  '<': 'less',
  '>': 'greater',
  '?': 'question',
  '~': 'tilde',
};

export const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'cmd'] as const;

type ModifierKey = typeof MODIFIER_ORDER[number];

export const PLATFORM_MODIFIERS = {
  mac: {
    cmd: 'metaKey',
    ctrl: 'ctrlKey',
    alt: 'altKey',
    shift: 'shiftKey',
  },
  windows: {
    ctrl: 'ctrlKey',
    alt: 'altKey',
    shift: 'shiftKey',
    win: 'metaKey',
  },
  linux: {
    ctrl: 'ctrlKey',
    alt: 'altKey',
    shift: 'shiftKey',
    super: 'metaKey',
  },
} as const;

export class KeyStringParser {
  private static readonly MODIFIER_INDEX_MAP = new Map([
    ['ctrl', 0],
    ['alt', 1],
    ['shift', 2],
    ['cmd', 3],
  ]);

  private platform: 'mac' | 'windows' | 'linux';
  private keyStringCache = new Map<string, string>();

  constructor() {
    this.platform = this.detectPlatform();
  }

  private detectPlatform(): 'mac' | 'windows' | 'linux' {
    if (typeof navigator === 'undefined') {
      return 'linux';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('win')) return 'windows';
    return 'linux';
  }

  /**
   * Normalizes a key string from shortcut definition into consistent format
   *
   * Converts various input formats into a standardized, platform-specific key string.
   * Handles cross-platform modifier mapping (Ctrl ↔ Cmd) and ensures consistent ordering.
   * Uses caching to improve performance for repeated calls with the same input.
   *
   * @param keyString - Raw key combination string (e.g., "Ctrl+Shift+F1", "cmd+s")
   * @returns Normalized key string with platform-specific modifiers in consistent order
   * @throws Error when input is invalid, null, undefined, or malformed
   *
   * @example
   * ```typescript
   * // On Mac:
   * parser.normalizeKeyString("Ctrl+S") // → "cmd+s"
   * parser.normalizeKeyString("shift+ctrl+f1") // → "cmd+shift+f1"
   *
   * // On Windows/Linux:
   * parser.normalizeKeyString("Cmd+S") // → "ctrl+s"
   * parser.normalizeKeyString("ALT+F4") // → "alt+f4"
   * ```
   */
  public normalizeKeyString(keyString: string): string {
    if (this.keyStringCache.has(keyString)) {
      return this.keyStringCache.get(keyString)!;
    }

    const result = this.computeNormalizedKeyString(keyString);

    this.keyStringCache.set(keyString, result);

    return result;
  }

  /**
   * Internal method that performs the actual key string normalization computation
   * @param keyString - Raw key combination string
   * @returns Normalized key string
   */
  private computeNormalizedKeyString(keyString: string): string {
    if (keyString === null || keyString === undefined) {
      throw new Error(`Invalid key string input: expected string, got ${keyString}`);
    }

    if (typeof keyString !== 'string') {
      throw new Error(`Invalid key string input: expected string, got ${typeof keyString}`);
    }

    if (keyString.trim() === '') {
      throw new Error('Key string cannot be empty or whitespace-only');
    }

    if (keyString.includes('+++')) {
      throw new Error(
        `Malformed key string: contains three or more consecutive '+' characters: "${keyString}"`
      );
    }

    if (/\+\+(?!$)/.test(keyString)) {
      throw new Error(
        `Malformed key string: invalid consecutive '+' characters (not at end): "${keyString}"`
      );
    }

    if (keyString.startsWith('+')) {
      throw new Error(`Malformed key string: cannot start with '+': "${keyString}"`);
    }

    if (keyString.endsWith('+') && !keyString.endsWith('++')) {
      throw new Error(`Malformed key string: cannot end with single '+': "${keyString}"`);
    }

    const parts = keyString
      .toLowerCase()
      .split('+')
      .map((part) => {
        if (part === ' ') {
          return 'space';
        }
        return part.trim();
      })
      .filter((part) => part.length > 0);

    const modifiers: ModifierKey[] = [];
    let key = '';

    for (const part of parts) {
      if (this.isModifier(part)) {
        const normalizedModifier = this.normalizeModifier(part);
        if (normalizedModifier && !modifiers.includes(normalizedModifier as ModifierKey)) {
          const platformMappedModifier = this.applyPlatformMapping(
            normalizedModifier
          ) as ModifierKey;
          if (!modifiers.includes(platformMappedModifier)) {
            modifiers.push(platformMappedModifier);
          }
        }
      } else if (part.length > 0) {
        const normalizedKey = this.normalizeKey(part);
        if (normalizedKey.length > 0) {
          key = normalizedKey;
        }
      }
    }

    modifiers.sort((a, b) => {
      const aIndex = KeyStringParser.MODIFIER_INDEX_MAP.get(a) ?? -1;
      const bIndex = KeyStringParser.MODIFIER_INDEX_MAP.get(b) ?? -1;
      return aIndex - bIndex;
    });

    if (modifiers.length > 0 && !key) {
      return modifiers.join('+');
    }

    return this.buildKeyString(modifiers, key);
  }

  /**
   * Generates a normalized key string from a keyboard event
   *
   * Extracts modifier keys and main key from a KeyboardEvent and converts them
   * into the same normalized format used by normalizeKeyString for comparison.
   * Applies platform-specific modifier mapping for cross-platform consistency.
   *
   * @param event - The keyboard event from user input
   * @returns Normalized key string matching the format from normalizeKeyString
   *
   * @example
   * ```typescript
   * document.addEventListener('keydown', (event) => {
   *   const keyString = parser.getEventKeyString(event);
   *   // User presses Cmd+S on Mac → "cmd+s"
   *   // User presses Ctrl+S on Windows → "ctrl+s"
   *
   *   // Compare with config shortcut
   *   if (keyString === parser.normalizeKeyString("Ctrl+S")) {
   *     // Execute save action
   *   }
   * });
   * ```
   */
  public getEventKeyString(event: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (event.ctrlKey) {
      const mappedModifier = this.applyPlatformMapping('ctrl');
      modifiers.push(mappedModifier);
    }
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    if (event.metaKey) {
      const mappedModifier = this.applyPlatformMapping('cmd');
      modifiers.push(mappedModifier);
    }

    const key = this.normalizeKey(event.key);

    return this.buildKeyString(modifiers, key);
  }

  private isModifier(key: string): boolean {
    const normalizedKey = key.toLowerCase();
    return ['ctrl', 'alt', 'shift', 'cmd', 'meta', 'win', 'super', 'control'].includes(
      normalizedKey
    );
  }

  private normalizeModifier(modifier: string): string | null {
    const normalized = modifier.toLowerCase();

    switch (normalized) {
      case 'ctrl':
      case 'control':
        return 'ctrl';
      case 'alt':
        return 'alt';
      case 'shift':
        return 'shift';
      case 'cmd':
      case 'meta':
      case 'win':
      case 'super':
        return 'cmd';
      default:
        return null;
    }
  }

  private applyPlatformMapping(modifier: string): string {
    if (this.platform === 'mac' && modifier === 'ctrl') {
      return 'cmd';
    }

    if (this.platform !== 'mac' && modifier === 'cmd') {
      return 'ctrl';
    }

    return modifier;
  }

  private buildKeyString(modifiers: string[], key: string): string {
    return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
  }

  private normalizeKey(key: string): string {
    const trimmed = key.trim();

    if (key === ' ' || (key.trim() === '' && key.length > 0)) {
      return 'space';
    }

    if (trimmed === '') {
      return '';
    }

    if (SPECIAL_KEY_MAPPINGS[trimmed]) {
      return SPECIAL_KEY_MAPPINGS[trimmed];
    }

    if (trimmed.length === 1) {
      return trimmed.toLowerCase();
    }

    const lowerKey = trimmed.toLowerCase();

    if (/^f\d{1,2}$/i.test(trimmed)) {
      return lowerKey;
    }

    if (trimmed.startsWith('Numpad')) {
      return `numpad${trimmed.slice(6).toLowerCase()}`;
    }

    return lowerKey;
  }

  public isValidKeyString(keyString: string): boolean {
    if (!keyString || typeof keyString !== 'string') {
      return false;
    }

    const normalized = this.normalizeKeyString(keyString);
    const parts = normalized.split('+');

    if (parts.length === 0) {
      return false;
    }

    const lastPart = parts[parts.length - 1];
    if (this.isModifier(lastPart)) {
      return false;
    }

    for (let i = 0; i < parts.length - 1; i++) {
      if (!this.isModifier(parts[i])) {
        return false;
      }
    }

    return true;
  }

  public getDisplayString(keyString: string): string {
    const normalized = this.normalizeKeyString(keyString);
    const parts = normalized.split('+');

    return parts
      .map((part) => {
        switch (part) {
          case 'ctrl':
            return this.platform === 'mac' ? '⌃' : 'Ctrl';
          case 'alt':
            return this.platform === 'mac' ? '⌥' : 'Alt';
          case 'shift':
            return this.platform === 'mac' ? '⇧' : 'Shift';
          case 'cmd':
            return this.platform === 'mac' ? '⌘' : 'Win';
          case 'enter':
            return '↵';
          case 'backspace':
            return '⌫';
          case 'delete':
            return '⌦';
          case 'tab':
            return '⇥';
          case 'escape':
            return 'Esc';
          case 'space':
            return 'Space';
          case 'up':
            return '↑';
          case 'down':
            return '↓';
          case 'left':
            return '←';
          case 'right':
            return '→';
          default:
            return part.charAt(0).toUpperCase() + part.slice(1);
        }
      })
      .join(this.platform === 'mac' ? '' : '+');
  }
}
