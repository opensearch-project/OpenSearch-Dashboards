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

import { ShortcutDefinition } from '../types';

/**
 * Manages multi-key sequences like 'g d' for navigation
 */
export class SequenceMatcher {
  private firstKey: string | null = null; // First key in sequence
  private secondKey: string | null = null; // Second key in sequence
  private sequenceTimer: NodeJS.Timeout | null = null; // Timeout to clear sequence
  private readonly SEQUENCE_TIMEOUT = 1000; // 1 second timeout between keys
  private singleKeyFallback: string | null = null; // Key to check as single key after sequence reset

  /**
   * Process a key event and check for sequence matches
   */
  public processKeyEvent(
    event: KeyboardEvent,
    shortcuts: Map<string, ShortcutDefinition>
  ): ShortcutDefinition | null {
    const key = event.key.toLowerCase();

    // Don't process special keys for sequences, but allow modifier keys
    // since sequences like 'g+shift' should work
    if (this.isSpecialKey(key)) {
      return null;
    }

    // Add key to sequence buffer
    this.addToSequence(key, shortcuts);

    // Check for sequence matches
    const match = this.findSequenceMatch(shortcuts);
    if (match) {
      this.clearSequence();
      return match;
    }

    return null;
  }

  /**
   * Add a key to the sequence with smart recovery
   */
  private addToSequence(key: string, shortcuts: Map<string, ShortcutDefinition>): void {
    // Clear existing timer and single key fallback
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
    }
    this.singleKeyFallback = null;

    if (this.firstKey === null) {
      // First key in sequence
      this.firstKey = key;

      // Set timer to clear sequence if no second key comes
      this.sequenceTimer = setTimeout(() => {
        this.clearSequence();
      }, this.SEQUENCE_TIMEOUT);
    } else {
      // Second key - check for exact match
      this.secondKey = key;
      const sequenceKey = `${this.firstKey}+${this.secondKey}`;

      if (this.hasSequence(sequenceKey, shortcuts)) {
        // Exact match found - will be processed by caller
        return;
      } else {
        // No sequence match - reset and handle second key intelligently
        this.clearSequence();

        // Smart recovery: check what to do with the second key
        if (this.couldStartSequence(key, shortcuts)) {
          // Key could start a new sequence
          this.firstKey = key;
          this.sequenceTimer = setTimeout(() => {
            this.clearSequence();
          }, this.SEQUENCE_TIMEOUT);
        } else {
          // Key doesn't start sequences - mark for single key check
          this.singleKeyFallback = key;
        }
      }
    }
  }

  /**
   * Find a shortcut that matches the current sequence
   */
  private findSequenceMatch(shortcuts: Map<string, ShortcutDefinition>): ShortcutDefinition | null {
    for (const shortcut of shortcuts.values()) {
      if (!this.isSequenceKey(shortcut.keys)) continue;

      const sequence = this.parseSequence(shortcut.keys);
      if (this.sequenceMatches(sequence)) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * Check if a key string represents a sequence
   */
  private isSequenceKey(keyString: string): boolean {
    return this.getKeyType(keyString) === 'sequence';
  }

  /**
   * Determine the type of key combination
   */
  private getKeyType(keyString: string): 'single' | 'modifier' | 'sequence' {
    // Single key (no + at all)
    if (!keyString.includes('+')) {
      return 'single';
    }

    const parts = keyString.split('+').filter((part) => part.length > 0);

    // Check if it's a modifier combination
    if (this.isModifierCombo(keyString)) {
      return 'modifier';
    }

    // Check if it's a valid two-key sequence
    if (parts.length === 2 && this.isValidTwoKeySequence(parts)) {
      return 'sequence';
    }

    // Everything else is treated as single key (VS Code approach - no validation)
    return 'single';
  }

  /**
   * Check if a key string is a modifier combination
   */
  private isModifierCombo(keyString: string): boolean {
    const modifiers = ['ctrl', 'cmd', 'shift', 'alt', 'meta'];
    const parts = keyString.split('+').filter((part) => part.length > 0);

    if (parts.length < 2) return false; // Need at least modifier + key

    // Check if any part except the last is a modifier
    for (let i = 0; i < parts.length - 1; i++) {
      if (modifiers.includes(parts[i].toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if parts form a valid two-key sequence using reserved prefixes
   */
  private isValidTwoKeySequence(parts: string[]): boolean {
    if (parts.length !== 2) return false;

    // Check if first part is a reserved sequence prefix
    const SEQUENCE_PREFIXES = ['g']; // Must match the main service
    const [prefix] = parts;
    return SEQUENCE_PREFIXES.includes(prefix);
  }

  /**
   * Parse sequence from key string (e.g., 'g+d' -> ['g', 'd'])
   */
  private parseSequence(keyString: string): string[] {
    return keyString.split('+');
  }

  /**
   * Check if current sequence matches target sequence
   */
  private sequenceMatches(targetSequence: string[]): boolean {
    // Only support 2-key sequences
    if (targetSequence.length !== 2) {
      return false;
    }

    // Check if we have a complete 2-key sequence
    if (this.firstKey === null || this.secondKey === null) {
      return false;
    }

    // Match first and second keys
    return (
      this.firstKey === targetSequence[0].toLowerCase() &&
      this.secondKey === targetSequence[1].toLowerCase()
    );
  }

  /**
   * Clear the sequence
   */
  private clearSequence(): void {
    this.firstKey = null;
    this.secondKey = null;
    if (this.sequenceTimer) {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  /**
   * Check if key is a modifier key
   */
  private isModifierKey(key: string): boolean {
    return ['control', 'alt', 'shift', 'meta', 'cmd', 'ctrl'].includes(key);
  }

  /**
   * Check if key is a special key that shouldn't be part of sequences
   */
  private isSpecialKey(key: string): boolean {
    return [
      'escape',
      'enter',
      'tab',
      'backspace',
      'delete',
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
      'home',
      'end',
      'pageup',
      'pagedown',
    ].includes(key);
  }

  /**
   * Check if a specific sequence exists in the shortcuts
   */
  private hasSequence(sequenceKey: string, shortcuts: Map<string, ShortcutDefinition>): boolean {
    for (const shortcut of shortcuts.values()) {
      if (this.isSequenceKey(shortcut.keys) && shortcut.keys === sequenceKey) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a key could start any sequence
   */
  private couldStartSequence(key: string, shortcuts: Map<string, ShortcutDefinition>): boolean {
    for (const shortcut of shortcuts.values()) {
      if (this.isSequenceKey(shortcut.keys)) {
        const firstKeyInSequence = shortcut.keys.split('+')[0];
        if (firstKeyInSequence === key) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if there's a single key that should be checked after sequence reset
   */
  public hasSingleKeyFallback(): boolean {
    return this.singleKeyFallback !== null;
  }

  /**
   * Get the single key that should be checked and clear it
   */
  public getSingleKeyFallback(): string | null {
    const key = this.singleKeyFallback;
    this.singleKeyFallback = null;
    return key;
  }

  /**
   * Get current sequence for debugging
   */
  public getCurrentSequence(): string[] {
    const sequence: string[] = [];
    if (this.firstKey !== null) {
      sequence.push(this.firstKey);
    }
    if (this.secondKey !== null) {
      sequence.push(this.secondKey);
    }
    return sequence;
  }
}
