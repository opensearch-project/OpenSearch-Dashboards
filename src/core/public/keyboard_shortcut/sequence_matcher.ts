/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShortcutDefinition } from './types';
import { SEQUENCE_PREFIX } from './constants';
import { SINGLE_LETTER_REGEX } from './utils';

export class SequenceMatcher {
  private firstKey: string | null = null;
  private sequenceTimer: number | null = null;

  private readonly timeout: number;

  constructor(timeout: number = 1000) {
    this.timeout = timeout;
  }

  /**
   * Normalizes and validates sequence key strings
   *
   * @param keyString - Sequence string to normalize and validate
   * @returns Normalized sequence string
   * @throws Error if sequence format is invalid
   */
  public normalizeKeyString(keyString: string): string {
    const normalized = keyString.toLowerCase().trim();
    const parts = normalized.split(/\s+/).filter((part) => part.length > 0);

    if (parts.length !== 2) {
      throw new Error(
        `Invalid sequence: "${keyString}". Must be exactly two space-separated single keys.`
      );
    }

    const [prefix, secondKey] = parts;

    if (!SEQUENCE_PREFIX.has(prefix)) {
      throw new Error(
        `Invalid sequence prefix: "${prefix}". Allowed prefixes: ${Array.from(SEQUENCE_PREFIX).join(
          ', '
        )}`
      );
    }

    if (!SINGLE_LETTER_REGEX.test(secondKey)) {
      throw new Error(
        `Invalid sequence second key: "${secondKey}". Must be a single letter (a-z).`
      );
    }

    return `${prefix} ${secondKey}`;
  }

  public processKey(
    key: string,
    shortcutsMap: Map<string, ShortcutDefinition[]>
  ): ShortcutDefinition[] | null {
    if (this.firstKey === null) {
      this.handleFirstKey(key);
      return null;
    } else {
      return this.handleSecondKey(key, shortcutsMap);
    }
  }

  private handleFirstKey(key: string): void {
    this.firstKey = key;
    this.startSequenceTimer();
  }

  private handleSecondKey(
    key: string,
    shortcutsMap: Map<string, ShortcutDefinition[]>
  ): ShortcutDefinition[] | null {
    this.clearSequenceTimer();

    const sequenceKey = `${this.firstKey} ${key}`;
    const shortcuts = shortcutsMap.get(sequenceKey);

    this.resetSequence();

    if (shortcuts?.length) {
      return shortcuts;
    }

    this.firstKey = key;
    this.startSequenceTimer();

    return null;
  }

  private startSequenceTimer(): void {
    this.clearSequenceTimer();

    this.sequenceTimer = window.setTimeout(() => {
      this.resetSequence();
    }, this.timeout);
  }

  private clearSequenceTimer(): void {
    if (this.sequenceTimer !== null) {
      window.clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  private resetSequence(): void {
    this.firstKey = null;
    this.clearSequenceTimer();
  }
}
