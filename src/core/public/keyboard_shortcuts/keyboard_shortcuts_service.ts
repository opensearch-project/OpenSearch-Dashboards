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

import {
  KeyboardShortcutsSetup,
  KeyboardShortcutsStart,
  ShortcutDefinition,
  StartDeps,
} from './types';
import { findMatchingShortcuts } from './utils/key_matcher';
import { SequenceMatcher } from './utils/sequence_matcher';

/** @internal */
export class KeyboardShortcutsService {
  /**
   * Reserved prefixes that can start multi-key sequences
   * These keys cannot be used as single-key shortcuts without modifiers
   */
  private static readonly SEQUENCE_PREFIXES = ['g'] as const;

  /**
   * Semantic meanings for sequence prefixes:
   * 'g' - Go/Navigation (g+d = Go to Dashboard, g+v = Go to Visualize)
   *
   * Future expansion possibilities:
   * 'c' - Create/Copy operations
   * 'v' - View/Visualize operations
   * 'd' - Data/Delete operations
   */
  private static readonly SEQUENCE_SEMANTICS = {
    g: 'Go/Navigation',
  } as const;

  private shortcuts = new Map<string, ShortcutDefinition[]>();
  private isListening = false;

  /**
   * Handles multi-key sequences like 'g d' for navigation shortcuts.
   * Initialized immediately to be ready for processing key events without delay.
   */
  private sequenceMatcher = new SequenceMatcher();

  public setup(): KeyboardShortcutsSetup {
    return {
      register: (shortcuts) => this.register(shortcuts),
    };
  }

  public start(deps: StartDeps): KeyboardShortcutsStart {
    this.startEventListening();
    this.setupHelpModal();

    return {
      register: (shortcuts) => this.register(shortcuts),
      getAllRegisteredShortcuts: () => this.getAllRegisteredShortcuts(),
      getShortcutsByCategory: (category) => this.getShortcutsByCategory(category),
      showHelpModal: () => this.showHelpModal(),
      unregister: (id) => this.unregister(id),
    };
  }

  public stop() {
    this.stopEventListening();
    this.shortcuts.clear();
    this.sequenceMatcher = new SequenceMatcher(); // Reset sequence matcher
  }

  /**
   * Normalize key string for cross-platform compatibility
   *
   * Basic functionality:
   * - Converts to lowercase
   * - Splits by '+' delimiter (with special handling for '+' key)
   * - Removes duplicates
   * - Joins back with '+'
   *
   * Edge cases handled:
   * - Input validation: null, undefined, non-string, empty string
   * - Platform differences: ctrl vs cmd on Mac, meta key handling
   * - Key name variations: 'esc' → 'escape', 'del' → 'delete', 'spacebar' → 'space'
   * - Modifier aliases: 'control' → 'ctrl', 'command' → 'cmd', 'meta' → platform-specific
   * - Whitespace: trimming segments and input
   * - Duplicates: 'ctrl+ctrl+s' → 'ctrl+s'
   * - Special key handling: 'ctrl++' → 'ctrl++' (plus key), 'shift+=' → 'shift+='
   * - Malformed input: leading/trailing '+', empty segments
   * - Special characters: space key as ' ' or 'spacebar'
   * - Page navigation keys: 'pgup'/'pgdn' → 'pageup'/'pagedown'
   * - Insert/Delete variations: 'ins'/'del' → 'insert'/'delete'
   */
  private normalizeKeyString(keys: string): string {
    // Basic input validation
    if (!keys || typeof keys !== 'string') {
      // eslint-disable-next-line no-console
      console.warn('Invalid key string provided to normalizeKeyString:', keys);
      return '';
    }

    const trimmed = keys.trim();
    if (!trimmed) {
      // eslint-disable-next-line no-console
      console.warn('Empty key string provided to normalizeKeyString');
      return '';
    }

    // Platform detection for Mac-specific handling
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Smart splitting to handle special keys like '+', '=', '-'
    const segments = this.splitKeyString(trimmed.toLowerCase());

    if (segments.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('No valid key segments found in:', keys);
      return '';
    }

    // Normalize key names and handle platform differences
    const normalizedSegments = segments.map((segment) => {
      switch (segment) {
        // Modifier aliases
        case 'control':
          return isMac ? 'cmd' : 'ctrl';
        case 'command':
          return 'cmd';
        case 'meta':
          return isMac ? 'cmd' : 'ctrl';

        // Key name variations
        case 'esc':
          return 'escape';
        case 'del':
          return 'delete';
        case 'ins':
          return 'insert';
        case 'pgup':
          return 'pageup';
        case 'pgdn':
          return 'pagedown';
        case ' ':
          return 'space';
        case 'spacebar':
          return 'space';

        default:
          return segment;
      }
    });

    // Additional Mac-specific ctrl→cmd conversion
    if (isMac) {
      const ctrlIndex = normalizedSegments.findIndex((seg) => seg === 'ctrl');
      if (ctrlIndex !== -1) {
        normalizedSegments[ctrlIndex] = 'cmd';
      }
    }

    // Remove duplicates while preserving order
    const uniqueSegments = [];
    const seen = new Set();
    for (const segment of normalizedSegments) {
      if (!seen.has(segment)) {
        seen.add(segment);
        uniqueSegments.push(segment);
      }
    }

    // Final validation - only reject if truly malformed
    const result = uniqueSegments.join('+');
    if (result.startsWith('+') || (result.includes('++') && !this.isValidDoubleplus(result))) {
      // eslint-disable-next-line no-console
      console.warn('Malformed key combination after normalization:', result, 'from:', keys);
      return '';
    }

    return result;
  }

  /**
   * Smart split that handles special keys like '+', '=', '-' correctly
   * Examples:
   * - "ctrl++" → ["ctrl", "+"]
   * - "shift+=" → ["shift", "="]
   * - "alt+-" → ["alt", "-"]
   * - "ctrl+shift+s" → ["ctrl", "shift", "s"]
   */
  private splitKeyString(keyString: string): string[] {
    const segments: string[] = [];
    let currentSegment = '';
    let i = 0;

    while (i < keyString.length) {
      const char = keyString[i];

      if (char === '+') {
        // Check if this is a delimiter or the actual '+' key
        if (currentSegment.length > 0) {
          // We have a segment before this +, so this could be a delimiter
          const nextChar = keyString[i + 1];

          if (nextChar === undefined || nextChar === '+') {
            // End of string or another +, so this + is the key itself
            currentSegment += char;
          } else {
            // This + is a delimiter
            segments.push(currentSegment.trim());
            currentSegment = '';
          }
        } else {
          // No segment before, so this + is part of the key
          currentSegment += char;
        }
      } else {
        currentSegment += char;
      }

      i++;
    }

    // Add the last segment
    if (currentSegment.length > 0) {
      segments.push(currentSegment.trim());
    }

    // Filter out empty segments
    return segments.filter((segment) => segment.length > 0);
  }

  /**
   * Check if a double plus in the result is valid (e.g., "ctrl++")
   */
  private isValidDoubleplus(result: string): boolean {
    // Valid patterns: "modifier++" where the last + is the key
    const validPatterns = [
      /^(ctrl|cmd|alt|shift|meta)\+\+$/,
      /^(ctrl|cmd|alt|shift|meta)\+(ctrl|cmd|alt|shift|meta)\+\+$/,
    ];

    return validPatterns.some((pattern) => pattern.test(result));
  }

  /**
   * Validate shortcut definition with Reserved Key Strategy
   */
  private validateShortcutDefinition(shortcut: ShortcutDefinition): void {
    const keyString = shortcut.keys.toLowerCase();
    const keyType = this.getKeyType(keyString);

    if (keyType === 'single') {
      this.validateSingleKeyShortcut(keyString, shortcut);
    } else if (keyType === 'sequence') {
      this.validateSequenceShortcut(keyString, shortcut);
    }
    // Modifier combinations are always valid
  }

  /**
   * Validate single-key shortcuts - must have modifiers
   */
  private validateSingleKeyShortcut(keyString: string, shortcut: ShortcutDefinition): void {
    const hasModifier = this.hasModifier(keyString);
    const isReservedPrefix = KeyboardShortcutsService.SEQUENCE_PREFIXES.includes(keyString as any);

    if (!hasModifier) {
      if (isReservedPrefix) {
        throw new Error(
          `Single key '${keyString}' is reserved for sequences (${
            KeyboardShortcutsService.SEQUENCE_SEMANTICS[
              keyString as keyof typeof KeyboardShortcutsService.SEQUENCE_SEMANTICS
            ]
          }). ` +
            `Use with modifier: 'ctrl+${keyString}', 'alt+${keyString}', or 'shift+${keyString}'`
        );
      } else {
        // Check if this looks like a sequence attempt (contains '+')
        if (keyString.includes('+')) {
          const parts = keyString.split('+');
          if (parts.length === 2) {
            const [prefix] = parts;
            const validPrefixes = KeyboardShortcutsService.SEQUENCE_PREFIXES.join(', ');
            throw new Error(
              `'${prefix}' is not an allowed prefix key for sequences (valid prefixes: ${validPrefixes}).`
            );
          }
        }
        // For true single keys like "h", "r"
        throw new Error(
          `Single key '${keyString}' requires a modifier (ctrl, alt, shift). ` +
            `Use: 'ctrl+${keyString}', 'alt+${keyString}', or 'shift+${keyString}'`
        );
      }
    }
  }

  /**
   * Validate sequence shortcuts - must use reserved prefixes
   */
  private validateSequenceShortcut(keyString: string, shortcut: ShortcutDefinition): void {
    const parts = keyString.split('+');
    if (parts.length !== 2) {
      throw new Error(`Sequence '${keyString}' must be exactly two keys (e.g., 'g+d')`);
    }

    const [prefix, suffix] = parts;

    if (!KeyboardShortcutsService.SEQUENCE_PREFIXES.includes(prefix as any)) {
      const validPrefixes = KeyboardShortcutsService.SEQUENCE_PREFIXES.join(', ');
      throw new Error(
        `Sequence prefix '${prefix}' is not reserved. Valid prefixes: ${validPrefixes}. ` +
          `If '${prefix}' is not in sequence prefixes, it cannot be a sequence. ` +
          `Use a modifier instead: 'ctrl+${prefix}+${suffix}'`
      );
    }

    // Allow any suffix key - sequences like 'g+ctrl', 'g+d', 'g+shift' are all valid
    // The suffix validation was too restrictive and prevented valid sequences
  }

  /**
   * Check if key string contains modifiers
   */
  private hasModifier(keyString: string): boolean {
    const modifiers = ['ctrl', 'cmd', 'alt', 'shift', 'meta', 'control', 'command'];
    return modifiers.some((modifier) => keyString.includes(modifier + '+'));
  }

  // Register shortcuts with Reserved Key Strategy validation
  private register(shortcuts: ShortcutDefinition[]): string[] {
    const registeredIds: string[] = [];

    shortcuts.forEach((shortcut) => {
      // Construct full ID: shortcut.id + "." + shortcut.pluginId
      const fullId = `${shortcut.id}.${shortcut.pluginId}`;

      // Validate shortcut definition with Reserved Key Strategy
      this.validateShortcutDefinition(shortcut);

      // Normalize key string for cross-platform compatibility
      const normalizedKeys = this.normalizeKeyString(shortcut.keys);

      // No need for conflict detection - Reserved Key Strategy prevents conflicts

      const registeredShortcut: ShortcutDefinition = {
        ...shortcut,
        keys: normalizedKeys, // Store normalized key string
      };

      // Check for duplicate IDs and throw error if found
      this.checkForDuplicateId(fullId);

      // Get or create shortcut array for this key
      if (!this.shortcuts.has(normalizedKeys)) {
        this.shortcuts.set(normalizedKeys, []);
      }

      // Add shortcut to array (last registered wins)
      this.shortcuts.get(normalizedKeys)!.push(registeredShortcut);

      registeredIds.push(fullId);
    });

    return registeredIds;
  }

  /**
   * Check for duplicate IDs and throw error if found
   */
  private checkForDuplicateId(fullId: string): void {
    for (const [key, shortcutArray] of Array.from(this.shortcuts.entries())) {
      const existing = shortcutArray.find(
        (shortcut) => `${shortcut.id}.${shortcut.pluginId}` === fullId
      );
      if (existing) {
        throw new Error(
          `Duplicate keyboard shortcut ID '${fullId}' detected.\n` +
            `Existing shortcut: ${existing.keys} → ${existing.name}\n` +
            `Each shortcut must have a unique ID.`
        );
      }
    }
  }

  /**
   * Determine the type of key combination with Reserved Key Strategy
   */
  private getKeyType(keyString: string): 'single' | 'modifier' | 'sequence' {
    if (!keyString.includes('+')) {
      return 'single';
    }

    const parts = keyString.split('+').filter((part) => part.length > 0);

    // Check for modifier combinations first
    if (this.hasModifier(keyString)) {
      return 'modifier';
    }

    // Check for valid sequences (exactly 2 parts, first is reserved prefix)
    if (parts.length === 2) {
      const [prefix] = parts;
      if (KeyboardShortcutsService.SEQUENCE_PREFIXES.includes(prefix as any)) {
        return 'sequence';
      }
    }

    // Everything else is treated as single key
    return 'single';
  }

  private getAllShortcuts(): ShortcutDefinition[] {
    const all: ShortcutDefinition[] = [];
    for (const shortcutArray of Array.from(this.shortcuts.values())) {
      all.push(...shortcutArray);
    }
    return all;
  }

  /**
   * Get all currently registered shortcuts for help modal
   * Returns shortcuts that are currently in the registry (automatically context-aware)
   */
  public getAllRegisteredShortcuts(): ShortcutDefinition[] {
    const all: ShortcutDefinition[] = [];
    for (const shortcutArray of Array.from(this.shortcuts.values())) {
      all.push(...shortcutArray);
    }
    return all;
  }

  private getShortcutsByCategory(category: string): ShortcutDefinition[] {
    return this.getAllShortcuts().filter((shortcut) => shortcut.category === category);
  }

  private showHelpModal(): void {
    // Get all currently registered shortcuts (automatically context-aware)
    const allShortcuts = this.getAllRegisteredShortcuts();

    // eslint-disable-next-line no-console
    console.group('🎹 Keyboard Shortcuts Help');
    // eslint-disable-next-line no-console
    console.log(`Showing ${allShortcuts.length} currently registered shortcuts`);

    const categories = new Map<string, ShortcutDefinition[]>();

    for (const shortcut of allShortcuts) {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, []);
      }
      categories.get(shortcut.category)!.push(shortcut);
    }

    for (const [category, shortcuts] of categories.entries()) {
      // eslint-disable-next-line no-console
      console.group(`📁 ${category.toUpperCase()} (${shortcuts.length} shortcuts)`);
      shortcuts.forEach((shortcut) => {
        // eslint-disable-next-line no-console
        console.log(`${shortcut.name}: ${this.formatKeyCombo(shortcut.keys)}`);
      });
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  private unregister(fullId: string): void {
    // Search across all shortcut arrays for the shortcut by full ID and remove it
    for (const [key, shortcutArray] of this.shortcuts.entries()) {
      const index = shortcutArray.findIndex(
        (shortcut) => `${shortcut.id}.${shortcut.pluginId}` === fullId
      );
      if (index !== -1) {
        shortcutArray.splice(index, 1);

        // Clean up empty arrays
        if (shortcutArray.length === 0) {
          this.shortcuts.delete(key);
        }
        return;
      }
    }
  }

  /**
   * Get shortcuts relevant to the current context
   */
  private getRelevantShortcuts(): Map<string, ShortcutDefinition> {
    const relevantShortcuts = new Map<string, ShortcutDefinition>();

    // Include the most recent active shortcut for each key
    for (const [key, shortcutArray] of this.shortcuts) {
      // Find the most recent enabled shortcut (last in array)
      for (let i = shortcutArray.length - 1; i >= 0; i--) {
        const shortcut = shortcutArray[i];
        if (this.isShortcutActive(shortcut)) {
          relevantShortcuts.set(key, shortcut);
          break; // Use the most recent active shortcut
        }
      }
    }

    return relevantShortcuts;
  }

  /**
   * Check if a shortcut is currently active based on all conditions
   */
  private isShortcutActive(shortcut: ShortcutDefinition): boolean {
    // Evaluate condition function if present
    if (shortcut.condition && !shortcut.condition()) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the target element is a text input where shortcuts should be ignored
   */
  private isTextInputActive(target: EventTarget | null): boolean {
    if (!target || !(target as HTMLElement).tagName) return false;

    const element = target as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Check for input elements
    if (tagName === 'input') {
      const inputType = (element as HTMLInputElement).type.toLowerCase();
      const textInputTypes = ['text', 'search', 'url', 'tel', 'email', 'password'];
      return textInputTypes.includes(inputType);
    }

    // Check for other text input elements
    if (tagName === 'textarea') return true;

    // Check for contenteditable elements
    if (element.contentEditable === 'true') return true;

    return false;
  }

  /**
   * Find a single key shortcut that matches the given key
   * Optimized for O(1) lookup since shortcuts map uses key combination as Map key
   */
  private findSingleKeyShortcut(
    key: string,
    shortcuts: Map<string, ShortcutDefinition>
  ): ShortcutDefinition | null {
    const shortcut = shortcuts.get(key);
    return shortcut || null;
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    // Skip if typing in text input
    if (this.isTextInputActive(event.target)) {
      return;
    }

    // Debug logging for key events
    const eventKeyString = `${event.ctrlKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${
      event.shiftKey ? 'shift+' : ''
    }${event.metaKey ? 'cmd+' : ''}${event.key.toLowerCase()}`;
    // eslint-disable-next-line no-console
    console.log(`🎹 Key pressed: "${eventKeyString}" (key: "${event.key}", code: "${event.code}")`);

    // Get shortcuts relevant to current context
    const relevantShortcuts = this.getRelevantShortcuts();
    // eslint-disable-next-line no-console
    console.log(`📋 Available shortcuts:`, Array.from(relevantShortcuts.keys()));

    // First check for sequence matches (like 'g d')
    const sequenceMatch = this.sequenceMatcher.processKeyEvent(event, relevantShortcuts);
    if (sequenceMatch) {
      // eslint-disable-next-line no-console
      console.log(`Sequence match found: ${sequenceMatch.id}`);

      event.preventDefault();
      event.stopPropagation();

      try {
        sequenceMatch.execute(event);
        // eslint-disable-next-line no-console
        console.log(`Successfully executed sequence: ${sequenceMatch.id}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing keyboard shortcut sequence ${sequenceMatch.id}:`, error);
      }
      return;
    }

    // Check if sequence matcher has a single key fallback
    if (this.sequenceMatcher.hasSingleKeyFallback()) {
      const fallbackKey = this.sequenceMatcher.getSingleKeyFallback();
      if (fallbackKey) {
        // eslint-disable-next-line no-console
        console.log(`Checking single key fallback: ${fallbackKey}`);
        const singleKeyMatch = this.findSingleKeyShortcut(fallbackKey, relevantShortcuts);
        if (singleKeyMatch) {
          // eslint-disable-next-line no-console
          console.log(`Single key fallback match found: ${singleKeyMatch.id}`);

          event.preventDefault();
          event.stopPropagation();

          try {
            singleKeyMatch.execute(event);
            // eslint-disable-next-line no-console
            console.log(`Successfully executed single key fallback: ${singleKeyMatch.id}`);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error executing single key fallback ${singleKeyMatch.id}:`, error);
          }
          return;
        }
      }
    }

    // Then check for regular single-key shortcuts
    const matchingShortcuts = findMatchingShortcuts(event, relevantShortcuts);
    // eslint-disable-next-line no-console
    console.log(`Found ${matchingShortcuts.length} matching shortcuts for "${eventKeyString}"`);

    if (matchingShortcuts.length > 0) {
      // With array structure, just use the first (and should be only) matching shortcut
      // since getRelevantShortcuts already selected the most appropriate one
      const shortcut = matchingShortcuts[0];

      // eslint-disable-next-line no-console
      console.log(`Executing shortcut: ${shortcut.id}`);

      event.preventDefault();
      event.stopPropagation();

      try {
        shortcut.execute(event);
        // eslint-disable-next-line no-console
        console.log(`Successfully executed shortcut: ${shortcut.id}`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing keyboard shortcut ${shortcut.id}:`, error);
      }
    }
  };

  private startEventListening(): void {
    if (this.isListening) return;

    document.addEventListener('keydown', this.handleKeyboardEvent, true);
    this.isListening = true;
  }

  private stopEventListening(): void {
    if (!this.isListening) return;

    document.removeEventListener('keydown', this.handleKeyboardEvent, true);
    this.isListening = false;
  }

  private setupHelpModal(): void {
    this.register([
      // Global shortcuts with modifiers (follows Reserved Key Strategy)
      {
        id: 'showKeyboardHelp',
        pluginId: 'core',
        name: 'Show Keyboard Shortcuts Help',
        category: 'global',
        keys: 'shift+?', // Fixed: Use a proper single key with modifier
        execute: () => {
          // eslint-disable-next-line no-console
          console.log('Pressed shift+? - Show Keyboard Shortcuts Help!');
          this.showHelpModal();
        },
      },
    ]);
  }

  private formatKeyCombo(keys: string): string {
    return keys.replace(/\+/g, ' + ').replace(/cmd/g, '⌘').replace(/ctrl/g, 'Ctrl');
  }
}
