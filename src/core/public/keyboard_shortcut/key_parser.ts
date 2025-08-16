/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const SPECIAL_KEY_MAPPINGS: Record<string, string> = {
  // Arrow keys
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',

  // Whitespace and control keys
  ' ': 'space',
  tab: 'tab',
  enter: 'enter',
  return: 'enter',
  backspace: 'backspace',
  delete: 'delete',

  // Navigation keys
  home: 'home',
  end: 'end',
  pageup: 'pageup',
  pagedown: 'pagedown',
  insert: 'insert',

  // Escape key
  esc: 'escape',
  escape: 'escape',

  // Function keys
  f1: 'f1',
  f2: 'f2',
  f3: 'f3',
  f4: 'f4',
  f5: 'f5',
  f6: 'f6',
  f7: 'f7',
  f8: 'f8',
  f9: 'f9',
  f10: 'f10',
  f11: 'f11',
  f12: 'f12',

  // Basic punctuation
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

  // Numeric keypad keys
  numpad0: 'numpad0',
  numpad1: 'numpad1',
  numpad2: 'numpad2',
  numpad3: 'numpad3',
  numpad4: 'numpad4',
  numpad5: 'numpad5',
  numpad6: 'numpad6',
  numpad7: 'numpad7',
  numpad8: 'numpad8',
  numpad9: 'numpad9',
  numpaddecimal: 'numpaddecimal',
  numpadenter: 'numpadenter',
  numpadplus: 'numpadplus',
  numpadminus: 'numpadminus',
  numpadmultiply: 'numpadmultiply',
  numpaddivide: 'numpaddivide',
};

export const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'cmd'] as const;

type ModifierKey = typeof MODIFIER_ORDER[number];

type PlatformMappingKeys = 'ctrl' | 'control' | 'meta' | 'win' | 'super' | 'command' | 'cmd';

interface PlatformModifierMappings {
  readonly mac: Record<PlatformMappingKeys, ModifierKey>;
  readonly other: Record<PlatformMappingKeys, ModifierKey>;
}

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

interface PlatformDisplayMappings {
  readonly mac: Record<DisplayMappingKeys, string>;
  readonly other: Record<DisplayMappingKeys, string>;
}

export class KeyStringParser {
  private static readonly MODIFIER_INDEX_MAP = new Map([
    ['ctrl', 0],
    ['alt', 1],
    ['shift', 2],
    ['cmd', 3],
  ]);

  private static readonly MODIFIER_KEYS = new Set([
    'ctrl',
    'alt',
    'shift',
    'cmd',
    'meta',
    'win',
    'super',
    'control',
    'option',
    'command',
    'opt',
  ]);

  private static readonly MODIFIER_ALIASES = new Map([
    ['control', 'ctrl'],
    ['meta', 'cmd'],
    ['win', 'cmd'],
    ['super', 'cmd'],
    ['option', 'alt'],
    ['command', 'cmd'],
    ['opt', 'alt'],
  ]);

  private static readonly VALID_MODIFIERS = new Set(MODIFIER_ORDER);

  private static readonly PLATFORM_MODIFIER_MAPPINGS: PlatformModifierMappings = {
    mac: {
      ctrl: 'cmd',
      control: 'cmd',
      meta: 'cmd',
      win: 'cmd',
      super: 'cmd',
      command: 'cmd',
      cmd: 'cmd',
    },
    other: {
      ctrl: 'ctrl',
      control: 'ctrl',
      meta: 'ctrl',
      win: 'ctrl',
      super: 'ctrl',
      command: 'ctrl',
      cmd: 'ctrl',
    },
  } as const;

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
      cmd: 'Win',
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

  private platform = this.detectPlatform();
  private keyStringCache = new Map<string, string>();

  private detectPlatform() {
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
   *
   * // On Mac:
   * parser.normalizeKeyString("Ctrl+S") // → "cmd+s"
   * parser.normalizeKeyString("shift+ctrl+f1") // → "cmd+shift+f1"
   *
   * // On Windows/Linux:
   * parser.normalizeKeyString("Cmd+S") // → "ctrl+s"
   * parser.normalizeKeyString("ALT+F4") // → "alt+f4"
   *
   */
  public normalizeKeyString(keyString: string): string {
    if (this.keyStringCache.has(keyString)) {
      const value = this.keyStringCache.get(keyString)!;
      this.keyStringCache.delete(keyString);
      this.keyStringCache.set(keyString, value);
      return value;
    }

    const result = this.computeNormalizedKeyString(keyString);

    this.keyStringCache.set(keyString, result);

    return result;
  }

  private handlePlusKeySpecialCase(keyString: string): string | null {
    const trimmed = keyString.trim();

    if (!trimmed.endsWith('++')) {
      return null;
    }

    const withoutPlusKey = trimmed.slice(0, -2);

    if (withoutPlusKey.length === 0) {
      return 'plus';
    }

    const modifierPart = this.computeNormalizedKeyString(withoutPlusKey);
    return modifierPart ? `${modifierPart}+plus` : 'plus';
  }

  private computeNormalizedKeyString(keyString: string): string {
    const plusKeyResult = this.handlePlusKeySpecialCase(keyString);
    if (plusKeyResult !== null) {
      return plusKeyResult;
    }

    const rawParts = keyString.toLowerCase().split('+');
    const modifiers: ModifierKey[] = [];
    const keys: string[] = [];
    const modifierSet = new Set<ModifierKey>();

    for (const rawPart of rawParts) {
      let part = rawPart.trim();

      if (part === ' ') {
        part = 'space';
      }

      if (part.length === 0) continue;

      if (this.isModifier(part)) {
        const normalizedModifier = this.normalizeModifier(part);
        if (normalizedModifier) {
          const platformMappedModifier = this.applyPlatformMapping(normalizedModifier);

          if (!modifierSet.has(platformMappedModifier)) {
            modifierSet.add(platformMappedModifier);
            modifiers.push(platformMappedModifier);
          }
        }
      } else {
        const normalizedKey = this.normalizeKey(part);
        if (normalizedKey.length > 0) {
          keys.push(normalizedKey);
        }
      }
    }

    modifiers.sort((a, b) => {
      const aIndex = KeyStringParser.MODIFIER_INDEX_MAP.get(a) ?? -1;
      const bIndex = KeyStringParser.MODIFIER_INDEX_MAP.get(b) ?? -1;
      return aIndex - bIndex;
    });

    if (modifiers.length > 0 && keys.length === 0) {
      return modifiers.join('+');
    }

    if (keys.length === 1) {
      return this.buildKeyString(modifiers, keys[0]);
    }

    if (modifiers.length > 0) {
      return `${modifiers.join('+')}+${keys.join('+')}`;
    }

    return keys.join('+');
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
   *
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
   *
   */
  public getEventKeyString(event: KeyboardEvent): string {
    const modifierChecks = [
      { check: event.ctrlKey, key: 'ctrl' },
      { check: event.altKey, key: 'alt' },
      { check: event.shiftKey, key: 'shift' },
      { check: event.metaKey, key: 'cmd' },
    ];

    const modifiers = modifierChecks
      .filter(({ check }) => check)
      .map(({ key }) => this.applyPlatformMapping(key));

    const key = this.normalizeKey(event.key.toLowerCase());

    return this.buildKeyString(modifiers, key);
  }

  private isModifier(key: string): boolean {
    return KeyStringParser.MODIFIER_KEYS.has(key.toLowerCase());
  }

  private normalizeModifier(modifier: string): string | null {
    const normalized = modifier.toLowerCase();

    const alias = KeyStringParser.MODIFIER_ALIASES.get(normalized);
    if (alias) return alias;

    return KeyStringParser.VALID_MODIFIERS.has(normalized as ModifierKey) ? normalized : null;
  }

  private applyPlatformMapping(modifier: string): ModifierKey {
    const mappings =
      this.platform === 'mac'
        ? KeyStringParser.PLATFORM_MODIFIER_MAPPINGS.mac
        : KeyStringParser.PLATFORM_MODIFIER_MAPPINGS.other;

    const normalized = modifier.toLowerCase() as PlatformMappingKeys;
    return mappings[normalized] || (normalized as ModifierKey);
  }

  private buildKeyString(modifiers: string[], key: string): string {
    if (modifiers.length === 0) return key;
    if (!key) return modifiers.join('+');
    return `${modifiers.join('+')}+${key}`;
  }

  private normalizeKey(key: string): string {
    if (key === ' ') {
      return 'space';
    }

    const trimmed = key.trim().toLowerCase();

    if (!trimmed) {
      return '';
    }

    const specialMapping = SPECIAL_KEY_MAPPINGS[trimmed];
    if (specialMapping) {
      return specialMapping;
    }

    if (trimmed.length === 1) {
      return trimmed;
    }

    return trimmed;
  }

  /**
   * Validates a key string and throws detailed error messages for invalid input
   *
   * Performs comprehensive validation including format checking and semantic validation.
   * Combines the logic from the previous validateInput and isValidKeyString methods.
   * Throws specific error messages to help developers understand what's wrong with their input.
   *
   * @param keyString - Raw key combination string to validate
   * @throws Error when input is invalid with detailed error message
   *
   * @example
   *
   * parser.validateKeyString("ctrl+s"); // succeeds
   * parser.validateKeyString("ctrl+"); // throws "Malformed key string: invalid '+' character placement"
   * parser.validateKeyString("ctrl a"); // throws "Chord sequences are not supported"
   *
   */
  public validateKeyString(keyString: string): void {
    if (keyString === null || keyString === undefined) {
      throw new Error(`Key string cannot be null or undefined`);
    }

    if (keyString === '' || (keyString.trim() === '' && keyString !== ' ')) {
      throw new Error(`Key string cannot be empty or whitespace-only: "${keyString}"`);
    }

    const trimmed = keyString.trim();

    if (trimmed.includes(' ') && !trimmed.includes('+ ') && trimmed !== ' ') {
      throw new Error(
        `Chord sequences are not supported. Found space in key string: "${keyString}". ` +
          `Use '+' to separate simultaneous keys (e.g., "ctrl+shift+s").`
      );
    }

    if (/\+\+(?!$)/.test(trimmed)) {
      throw new Error(
        `Malformed key string: invalid consecutive '+' characters (not at end): "${keyString}"`
      );
    }

    if (
      trimmed.startsWith('+') ||
      (trimmed.endsWith('+') && !trimmed.endsWith('++') && !keyString.endsWith('+ '))
    ) {
      throw new Error(`Malformed key string: invalid '+' character placement: "${keyString}"`);
    }

    const normalized = this.normalizeKeyString(keyString);
    const parts = normalized.split('+');

    if (parts.length === 0) {
      throw new Error(`Malformed key string: no valid keys found: "${keyString}"`);
    }

    let modifierCount = 0;
    let keyCount = 0;

    for (const part of parts) {
      if (this.isModifier(part)) {
        modifierCount++;
      } else {
        keyCount++;
      }
    }

    if (keyCount === 0) {
      throw new Error(
        `Malformed key string: only modifier keys found, no action key: "${keyString}"`
      );
    }

    if (keyCount > 2) {
      throw new Error(
        `Malformed key string: too many non-modifier keys (${keyCount}): "${keyString}"`
      );
    }

    if (keyCount > 1 && modifierCount > 0) {
      if (keyCount === 2) {
        throw new Error(
          `Malformed key string: two-key sequences cannot have modifiers: "${keyString}"`
        );
      }
      throw new Error(
        `Malformed key string: multiple non-modifier keys with modifiers: "${keyString}"`
      );
    }
  }

  public isValidKeyString(keyString: string): void {
    return this.validateKeyString(keyString);
  }

  public getDisplayString(keyString: string): string {
    const normalized = this.normalizeKeyString(keyString);
    const parts = normalized.split('+');
    const mappings =
      this.platform === 'mac'
        ? KeyStringParser.DISPLAY_MAPPINGS.mac
        : KeyStringParser.DISPLAY_MAPPINGS.other;

    return parts
      .map(
        (part) =>
          mappings[part as keyof typeof mappings] ?? part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(this.platform === 'mac' ? '' : '+');
  }

  public clearCache(): void {
    this.keyStringCache.clear();
  }
}
