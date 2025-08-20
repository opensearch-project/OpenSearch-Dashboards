/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive set of keys supported by the keyboard shortcut service.
 */
export const ALLOWED_KEYS = new Set([
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
]);

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
 * Valid modifier combinations in their canonical order.
 *
 * Each combination is listed in canonical order to ensure consistent normalization
 * regardless of the input order (e.g., "shift+cmd+a" becomes "cmd+shift+a").
 */

export const VALID_MODIFIER_COMBINATIONS = [
  [], // No modifiers - enables single keys and two-key sequences
  ['shift'],
  ['alt'],
  ['cmd'],
  ['alt', 'shift'],
  ['cmd', 'shift'],
  ['cmd', 'alt'],
  ['cmd', 'alt', 'shift'],
] as const;

/**
 * Valid individual modifier keys.
 */
export const VALID_MODIFIERS = new Set(['cmd', 'alt', 'shift'] as const);

/**
 * Keys that can be displayed with special symbols or formatting.
 * Includes both modifier keys and special keys that have platform-specific display representations.
 * Used to generate user-friendly display strings (e.g., '⌘' for 'cmd' on Mac).
 */
type DisplayMappingKeys =
  | 'ctrl'
  | 'alt'
  | 'shift'
  | 'cmd'
  | 'enter'
  | 'backspace'
  | 'delete'
  | 'tab'
  | 'escape'
  | 'space'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'plus';

/**
 * Platform-specific display representations for keys.
 * Maps key names to their visual representation for each platform.
 *
 * @example
 * // Mac: 'cmd' → '⌘', 'shift' → '⇧', 'up' → '↑'
 * // Windows/Linux: 'cmd' → 'Ctrl', 'shift' → 'Shift', 'up' → '↑'
 */
interface PlatformDisplayMappings {
  readonly mac: Record<DisplayMappingKeys, string>;
  readonly other: Record<DisplayMappingKeys, string>;
}

export class KeyStringParser {
  /**
   * Maps KeyboardEvent.code values to normalized key names.
   */
  private static readonly CODE_TO_KEY_MAPPING: Record<string, string> = {
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

  private static readonly DISPLAY_MAPPINGS: PlatformDisplayMappings = {
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

  private keyStringCache = new Map<string, string>();

  /**
   * Normalizes a key string from shortcut definition into consistent Mac-style format
   *
   * Converts various input formats into a standardized Mac-style key string for consistent
   * codebase registration. All platforms register shortcuts the same way (Mac-style) but
   * display them appropriately for each platform. Uses caching for performance.
   *
   * @param keyString - Raw key combination string (e.g., "cmd+s", "alt+shift+a")
   * @returns Normalized Mac-style key string with cmd-first modifier order
   * @throws Error when input is invalid, null, undefined, or malformed
   *
   * @example
   *
   * // Valid key combinations using supported modifier names:
   * parser.normalizeKeyString("cmd+s") // → "cmd+s"
   * parser.normalizeKeyString("alt+h") // → "alt+h"
   * parser.normalizeKeyString("shift+cmd+a") // → "cmd+shift+a"
   * parser.normalizeKeyString("cmd+alt+shift+z") // → "cmd+alt+shift+z"
   *
   * // Invalid keys are rejected:
   * parser.normalizeKeyString("f1") // → throws Error
   * parser.normalizeKeyString("ctrl+s") // → throws Error (use "cmd+s")
   * parser.normalizeKeyString("cmd++") // → throws Error
   *
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
   * Validates the input key string for basic format and structural issues.
   * Throws descriptive errors for invalid inputs.
   */
  private validateKeyString(keyString: string): void {
    if (keyString === null || keyString === undefined) {
      throw new Error(`Key string cannot be null or undefined`);
    }

    if (keyString === '') {
      throw new Error(`Key string cannot be empty: "${keyString}"`);
    }

    if (keyString.trim() === '' && keyString !== 'space') {
      throw new Error(`Key string cannot be whitespace-only: "${keyString}"`);
    }

    if (keyString.includes(' ') && keyString !== 'space') {
      throw new Error(`Extra spaces and chord sequences are not allowed: "${keyString}"`);
    }

    const normalized = keyString.toLowerCase();

    if (normalized.startsWith('+') || normalized.endsWith('+')) {
      throw new Error(`Malformed key string: invalid '+' character placement: "${keyString}"`);
    }

    if (/\+{2,}/.test(normalized)) {
      throw new Error(`Malformed key string: invalid consecutive '+' characters: "${keyString}"`);
    }
  }

  private computeNormalizedKeyString(keyString: string): string {
    this.validateKeyString(keyString);

    const normalized = keyString.toLowerCase();
    const parts = normalized.split('+').filter((part) => part);

    if (parts.length >= 2 && SEQUENCE_PREFIX.has(parts[0])) {
      for (const part of parts) {
        if (!ALLOWED_KEYS.has(part)) {
          throw new Error(
            `Invalid key: "${part}" in sequence "${keyString}". ` +
              `Sequences cannot contain modifiers. Allowed keys are: ${this.getKeyCategories()}`
          );
        }
      }

      if (parts.length === 2) {
        return parts.join('+');
      } else {
        throw new Error(`Invalid sequence: "${keyString}". Sequences must have exactly 2 keys.`);
      }
    }

    // Not a sequence - process as regular modifier + key combination
    const modifiers: string[] = [];
    const actualKeys: string[] = [];

    for (const part of parts) {
      if (VALID_MODIFIERS.has(part as 'cmd' | 'alt' | 'shift')) {
        if (!modifiers.includes(part)) modifiers.push(part);
      } else if (ALLOWED_KEYS.has(part)) {
        actualKeys.push(part);
      } else {
        throw new Error(
          `Invalid key: "${part}" in shortcut "${keyString}". ` +
            `Allowed keys are: ${this.getKeyCategories()}`
        );
      }
    }

    const orderedModifiers = this.getCanonicalModifierOrder(modifiers);

    if (actualKeys.length === 1) {
      return this.buildKeyString(orderedModifiers, actualKeys[0]);
    }

    if (actualKeys.length === 2) {
      throw new Error(
        `Invalid key combination: "${keyString}". Two-key combinations are only allowed for sequences starting with: ${Array.from(
          SEQUENCE_PREFIX
        ).join(', ')}`
      );
    }

    if (actualKeys.length === 0) {
      throw new Error(
        `Modifier-only shortcuts are not allowed: "${keyString}". Shortcuts must include at least one non-modifier key.`
      );
    }

    throw new Error(`Invalid key combination: too many keys (${actualKeys.length})`);
  }

  /**
   * Returns categorized description of allowed keys for error messages.
   */
  private getKeyCategories(): string {
    return [
      'Letters: a-z',
      'Numbers: 0-9',
      "Punctuation: , - = [ ] ; ' . / \\ `",
      'Arrows: left, up, right, down',
      'Special: tab, enter, escape, space, backspace, delete',
    ].join(' | ');
  }

  /**
   * Generates a normalized Mac-style key string from a keyboard event
   *
   * Extracts modifier keys and main key from a KeyboardEvent and converts them
   * into the same Mac-style normalized format used by normalizeKeyString for comparison.
   * Uses event.code instead of event.key to solve plus key ambiguity.
   * Always produces Mac-style output regardless of platform for consistent registration matching.
   *
   * @param event - The keyboard event from user input
   * @returns Normalized Mac-style key string matching the format from normalizeKeyString
   *
   * @example
   *
   * document.addEventListener('keydown', (event) => {
   *   const keyString = parser.getEventKeyString(event);
   *   // All platforms produce Mac-style output:
   *   // User presses Cmd+S on Mac → "cmd+s"
   *   // User presses Ctrl+S on Windows → "cmd+s" (normalized to Mac-style)
   *
   *   // Compare with config shortcut (both are Mac-style)
   *   if (keyString === parser.normalizeKeyString("Ctrl+S")) {
   *     // Execute save action - both strings are "cmd+s"
   *   }
   * });
   *
   */
  public getEventKeyString(event: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (event.ctrlKey || event.metaKey) {
      modifiers.push('cmd');
    }
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    const key = this.getKeyFromCode(event.code);
    if (!key) return '';

    const orderedModifiers = this.getCanonicalModifierOrder(modifiers);

    return this.buildKeyString(orderedModifiers, key);
  }

  /**
   * Maps KeyboardEvent.code to normalized key name.
   * Returns null for unmapped or disallowed keys.
   */
  private getKeyFromCode(code: string): string | null {
    const mappedKey = KeyStringParser.CODE_TO_KEY_MAPPING[code];
    return mappedKey && ALLOWED_KEYS.has(mappedKey) ? mappedKey : null;
  }

  /**
   * Finds the canonical modifier combination that matches the given modifiers.
   * Returns the modifiers in their predefined order.
   */
  private getCanonicalModifierOrder(modifiers: string[]): string[] {
    const modifierSet = new Set(modifiers);

    for (const combination of VALID_MODIFIER_COMBINATIONS) {
      if (
        combination.length === modifierSet.size &&
        combination.every((mod) => modifierSet.has(mod))
      ) {
        return [...combination];
      }
    }
    throw new Error(`Invalid modifier combination: [${modifiers.join(', ')}]`);
  }

  /**
   * Builds a normalized key string from modifiers and keys.
   * Handles the 3 supported shortcut types with proper formatting.
   */
  private buildKeyString(modifiers: string[], keys: string | string[]): string {
    const keyArray = Array.isArray(keys) ? keys : [keys];

    // Type 1: Single key (no modifiers)
    if (modifiers.length === 0 && keyArray.length === 1) {
      return keyArray[0];
    }

    // Type 2: Modifiers + single key
    if (keyArray.length === 1) {
      if (modifiers.length === 0) return keyArray[0];
      const orderedModifiers = this.getCanonicalModifierOrder(modifiers);
      return `${orderedModifiers.join('+')}+${keyArray[0]}`;
    }

    // Type 3: Two-key sequences (no modifiers allowed)
    if (keyArray.length === 2) {
      if (modifiers.length > 0) {
        throw new Error('Two-key sequences cannot have modifiers');
      }
      return keyArray.join('+');
    }

    // Edge case: Only modifiers (for validation purposes)
    if (keyArray.length === 0 || (keyArray.length === 1 && !keyArray[0])) {
      const orderedModifiers = this.getCanonicalModifierOrder(modifiers);
      return orderedModifiers.join('+');
    }

    // Invalid: Too many keys
    throw new Error(`Invalid key combination: too many keys (${keyArray.length})`);
  }

  public getDisplayString(keyString: string): string {
    const normalized = this.normalizeKeyString(keyString);
    const parts = normalized.split('+');

    const displayPlatform = this.detectDisplayPlatform();
    const mappings =
      displayPlatform === 'mac'
        ? KeyStringParser.DISPLAY_MAPPINGS.mac
        : KeyStringParser.DISPLAY_MAPPINGS.other;

    return parts
      .map(
        (part) =>
          mappings[part as keyof typeof mappings] ?? part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(displayPlatform === 'mac' ? '' : '+');
  }

  /**
   * Detects platform for display purposes only.
   * Registration always uses Mac-style, but display should match user's OS.
   */
  private detectDisplayPlatform(): 'mac' | 'other' {
    if (typeof navigator === 'undefined') {
      return 'other';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('mac') ? 'mac' : 'other';
  }

  public clearCache(): void {
    this.keyStringCache.clear();
  }
}
