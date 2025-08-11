/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyboardShortcutSetup, KeyboardShortcutStart, ShortcutDefinition } from './types';
import { KeyStringParser } from './key_parser';

/**
 * @internal
 * @experimental
 */
export class KeyboardShortcutService {
  private shortcutsMapByKey = new Map<string, ShortcutDefinition[]>();
  private namespacedIdToKeyLookup = new Map<string, string>();
  private keyParser = new KeyStringParser();

  public setup(): KeyboardShortcutSetup {
    return {
      register: (shortcut) => this.register(shortcut),
    };
  }

  public start(): KeyboardShortcutStart {
    this.startEventListener();

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
    if (!this.keyParser.isValidKeyString(shortcut.keys)) {
      // Invalid key strings are developer configuration errors - fail silently
      // to avoid console pollution while still preventing registration
      return;
    }

    const key = this.keyParser.normalizeKeyString(shortcut.keys);
    const namespacedId = this.getNamespacedId(shortcut);

    const existingShortcuts = this.shortcutsMapByKey.get(key) || [];
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

    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return true;
    }

    const role = element.getAttribute('role');
    if (role && ['textbox', 'combobox', 'searchbox'].includes(role)) {
      return true;
    }

    return false;
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (this.shouldIgnoreKeyboardEventForTarget(event.target)) {
      return;
    }

    const eventKeyString = this.keyParser.getEventKeyString(event);
    const shortcuts = this.shortcutsMapByKey.get(eventKeyString);

    if (shortcuts?.length) {
      // Prevent browser-specific keybindings if they conflict with our shortcuts
      event.preventDefault();

      const shortcut = shortcuts[shortcuts.length - 1];
      try {
        shortcut.execute();
      } catch (error) {
        // Silently handle shortcut execution errors
      }
    }
  };

  private startEventListener(): void {
    document.addEventListener('keydown', this.handleKeyboardEvent, true);
  }

  private stopEventListener(): void {
    document.removeEventListener('keydown', this.handleKeyboardEvent, true);
  }
}
