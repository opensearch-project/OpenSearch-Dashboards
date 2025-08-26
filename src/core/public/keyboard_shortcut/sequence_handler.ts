/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEQUENCE_PREFIX, SEQUENCE_TIMEOUT_MS } from './constants';
import { SINGLE_LETTER_REGEX } from './utils';

export class SequenceHandler {
  private firstKey: string | null = null;
  private sequenceTimerId: number | null = null;

  private readonly timeout: number;

  constructor(timeout: number = SEQUENCE_TIMEOUT_MS) {
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
    const parts = normalized.split(' ').filter((part) => !!part.length);

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

  public processFirstKey(key: string): void {
    this.firstKey = key;
    this.startSequenceTimer();
  }

  public processSecondKey(key: string): string {
    this.clearSequenceTimer();

    const sequenceKey = `${this.firstKey} ${key}`;
    this.resetSequence();

    // Only start new sequence if key is a valid sequence prefix
    if (SEQUENCE_PREFIX.has(key)) {
      this.firstKey = key;
      this.startSequenceTimer();
    }

    return sequenceKey;
  }

  private startSequenceTimer(): void {
    this.clearSequenceTimer();

    this.sequenceTimerId = window.setTimeout(() => {
      this.resetSequence();
    }, this.timeout);
  }

  private clearSequenceTimer(): void {
    if (this.sequenceTimerId !== null) {
      window.clearTimeout(this.sequenceTimerId);
      this.sequenceTimerId = null;
    }
  }

  private resetSequence(): void {
    this.firstKey = null;
    this.clearSequenceTimer();
  }

  public isInSequence(): boolean {
    return this.firstKey !== null;
  }
}
