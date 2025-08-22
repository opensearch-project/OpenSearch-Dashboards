/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KeyboardShortcutSetup,
  KeyboardShortcutStart,
  KeyboardShortcutConfig,
  ShortcutDefinition,
} from './types';
import { KeyStringParser } from './key_parser';
import { SequenceMatcher } from './sequence_matcher';

/**
 * @internal
 * @experimental
 */
export class KeyboardShortcutService {
  private shortcutsMapByKey = new Map<string, ShortcutDefinition[]>();
  private namespacedIdToKeyLookup = new Map<string, string>();
  private config: KeyboardShortcutConfig = { enabled: true };
  private keyParser = new KeyStringParser();
  private sequenceMatcher = new SequenceMatcher();

  public setup(): KeyboardShortcutSetup {
    return {
      register: (shortcut) => this.register(shortcut),
    };
  }

  public start(config?: KeyboardShortcutConfig): KeyboardShortcutStart {
    this.config = { enabled: config?.enabled ?? true };

    if (this.config.enabled) {
      this.startEventListener();
    }

    return {
      register: (shortcut) => this.register(shortcut),
      unregister: (shortcut) => this.unregister(shortcut),
    };
  }

  public stop() {
    this.stopEventListener();
    this.shortcutsMapByKey.clear();
    this.namespacedIdToKeyLookup.clear();
  }

  private getNamespacedId = (shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>) =>
    `${shortcut.id.toLowerCase()}.${shortcut.pluginId.toLowerCase()}`;

  private register(shortcut: ShortcutDefinition): void {
    if (!this.config.enabled) {
      return;
    }

    // Detect if it's a sequence (contains space) and use appropriate parser
    const key = shortcut.keys.includes(' ')
      ? this.sequenceMatcher.normalizeKeyString(shortcut.keys)
      : this.keyParser.normalizeKeyString(shortcut.keys);

    const namespacedId = this.getNamespacedId(shortcut);

    if (this.namespacedIdToKeyLookup.has(namespacedId)) {
      throw new Error(
        `Shortcut "${shortcut.id}" from plugin "${shortcut.pluginId}" is already registered`
      );
    }

    const existingShortcuts = this.shortcutsMapByKey.get(key) || [];

    if (existingShortcuts.length > 0) {
      const conflictingShortcuts = existingShortcuts
        .map((s) => `${s.id} (${s.pluginId})`)
        .join(', ');
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(
          `keyboard shortcut conflict detected for key "${shortcut.keys}". ` +
            `New shortcut "${shortcut.id}" from plugin "${shortcut.pluginId}" ` +
            `conflicts with active shortcuts: ${conflictingShortcuts}. ` +
            `The new shortcut will take precedence when the key is pressed.`
        );
      }
    }

    this.shortcutsMapByKey.set(key, [...existingShortcuts, shortcut]);
    this.namespacedIdToKeyLookup.set(namespacedId, key);
  }

  private unregister(shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>): void {
    const namespacedId = this.getNamespacedId(shortcut);

    const key = this.namespacedIdToKeyLookup.get(namespacedId);
    if (!key) {
      return;
    }

    this.namespacedIdToKeyLookup.delete(namespacedId);

    const shortcuts = this.shortcutsMapByKey.get(key);
    if (!shortcuts) {
      return;
    }

    const filteredShortcuts = shortcuts.filter(
      (existingShortcut: ShortcutDefinition) =>
        this.getNamespacedId(existingShortcut) !== namespacedId
    );

    if (filteredShortcuts.length !== shortcuts.length) {
      if (!filteredShortcuts.length) {
        this.shortcutsMapByKey.delete(key);
      } else {
        this.shortcutsMapByKey.set(key, filteredShortcuts);
      }
    }
  }

  private isHTMLElement(target: EventTarget | null): target is HTMLElement {
    return target !== null && 'tagName' in target;
  }

  private shouldIgnoreKeyboardEventForTarget(target: EventTarget | null): boolean {
    if (!this.isHTMLElement(target)) return false;

    const element = target;
    const tagName = element.tagName;

    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    if (inputTags.includes(tagName)) {
      return true;
    }

    const role = element.getAttribute('role');
    if (role && ['textbox', 'combobox', 'searchbox'].includes(role)) {
      return true;
    }

    const contentEditable = element.getAttribute('contenteditable');
    if (contentEditable === 'true' || contentEditable === '') {
      return true;
    }

    return false;
  }

  private executeShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): void {
    event.preventDefault();
    try {
      shortcut.execute();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `Error executing shortcut ${shortcut.id} from plugin ${shortcut.pluginId}:`,
        error
      );
    }
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (this.shouldIgnoreKeyboardEventForTarget(event.target)) {
      return;
    }

    const eventKeyString = this.keyParser.getEventKeyString(event);

    // Try sequence matching first
    const sequenceMatches = this.sequenceMatcher.processKey(eventKeyString, this.shortcutsMapByKey);
    if (sequenceMatches?.length) {
      // Execute the last registered shortcut (implements "last registered wins" policy)
      const shortcut = sequenceMatches[sequenceMatches.length - 1];
      this.executeShortcut(event, shortcut);
      return;
    }

    // Then regular shortcuts
    const regularShortcuts = this.shortcutsMapByKey.get(eventKeyString);
    if (regularShortcuts?.length) {
      // Execute the last registered shortcut (implements "last registered wins" policy)
      const shortcut = regularShortcuts[regularShortcuts.length - 1];
      this.executeShortcut(event, shortcut);
    }
  };

  private startEventListener(): void {
    document.addEventListener('keydown', this.handleKeyboardEvent, true);
  }

  private stopEventListener(): void {
    document.removeEventListener('keydown', this.handleKeyboardEvent, true);
  }
}
