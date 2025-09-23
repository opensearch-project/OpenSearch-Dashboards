/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VALID_KEY_STRING_REGEX } from './utils';
import {
  ALLOWED_KEYS,
  CODE_TO_KEY_MAPPING,
  DISPLAY_MAPPINGS,
  SEQUENCE_PREFIX,
  SPECIAL_CHARACTER_MAPPINGS,
} from './constants';

export class KeyStringParser {
  /**
   * Normalizes a key string from shortcut definition into consistent lowercase format
   *
   * Validates and converts key strings to lowercase for consistent registration.
   * All platforms register shortcuts the same way but display them appropriately
   * for each platform.
   *
   * @param keyString - Raw key combination string (e.g., "cmd+s", "Alt+Shift+A")
   * @returns Normalized lowercase key string
   * @throws Error when input is invalid or malformed
   *
   * @example
   *
   * // Valid key combinations are normalized to lowercase:
   * parser.normalizeKeyString("CMD+S") // → "cmd+s"
   * parser.normalizeKeyString("Alt+H") // → "alt+h"
   * parser.normalizeKeyString("cmd+shift+a") // → "cmd+shift+a"
   *
   * // Invalid keys are rejected:
   * parser.normalizeKeyString("f1") // → throws Error
   * parser.normalizeKeyString("ctrl+s") // → throws Error (use "cmd+s")
   * parser.normalizeKeyString("cmd++") // → throws Error
   *
   */
  public normalizeKeyString(keyString: string): string {
    const lowercasedKeyString = keyString.toLowerCase();

    if (SEQUENCE_PREFIX.has(lowercasedKeyString)) {
      throw new Error(`Cannot register single key "${keyString}" as it's reserved for sequences.`);
    }

    if (!VALID_KEY_STRING_REGEX.test(lowercasedKeyString)) {
      throw new Error(
        `Invalid key combination: "${keyString}". Please refer to our documentation to see what is valid.`
      );
    }

    return lowercasedKeyString;
  }

  /**
   * Generates a normalized key string from a keyboard event
   *
   * Extracts modifier keys and main key from a KeyboardEvent and converts them
   * into the same normalized format used by normalizeKeyString for comparison.
   * Uses event.code instead of event.key to solve plus key ambiguity.
   * Produces consistent output regardless of platform for registration matching.
   *
   * @param event - The keyboard event from user input
   * @returns Normalized key string matching the format from normalizeKeyString
   *
   * @example
   *
   * document.addEventListener('keydown', (event) => {
   *   const keyString = parser.getEventKeyString(event);
   *   // All platforms produce consistent output:
   *   // User presses Cmd+S on Mac → "cmd+s"
   *   // User presses Ctrl+S on Windows → "cmd+s" (normalized to "cmd")
   *
   *   // Compare with registered shortcut
   *   if (keyString === parser.normalizeKeyString("cmd+s")) {
   *     // Execute save action
   *   }
   * });
   *
   */
  public getEventKeyString(event: KeyboardEvent): string {
    // Platform-specific modifier detection
    const isMac = this.detectDisplayPlatform() === 'mac';

    const key = this.getKeyFromCode(event.code);
    if (!key) return '';

    // Build key string in canonical order: cmd, alt, shift
    let keyString = '';

    if (isMac ? event.metaKey : event.ctrlKey) {
      keyString += 'cmd+';
    }
    if (event.altKey) {
      keyString += 'alt+';
    }
    if (event.shiftKey) {
      keyString += 'shift+';
    }

    keyString += key;

    return keyString;
  }

  /**
   * Maps KeyboardEvent.code to normalized key name.
   * Returns null for unmapped or disallowed keys.
   */
  private getKeyFromCode(code: string): string | null {
    const mappedKey = CODE_TO_KEY_MAPPING[code];
    return mappedKey && (ALLOWED_KEYS as readonly string[]).includes(mappedKey) ? mappedKey : null;
  }

  public getDisplayString(keyString: string): string {
    const normalized = this.normalizeKeyString(keyString);

    // Check if this is a special character combination first
    if (normalized in SPECIAL_CHARACTER_MAPPINGS) {
      return SPECIAL_CHARACTER_MAPPINGS[normalized];
    }

    const parts = normalized.split('+');
    const displayPlatform = this.detectDisplayPlatform();
    const mappings = displayPlatform === 'mac' ? DISPLAY_MAPPINGS.mac : DISPLAY_MAPPINGS.other;

    return parts
      .map(
        (part) =>
          mappings[part as keyof typeof mappings] ?? part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join(displayPlatform === 'mac' ? '' : '+');
  }

  /**
   * Detects platform for display purposes only.
   * Registration uses consistent format, but display should match user's OS.
   */
  private detectDisplayPlatform(): 'mac' | 'other' {
    if (typeof navigator === 'undefined') {
      return 'other';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('mac') ? 'mac' : 'other';
  }
}
