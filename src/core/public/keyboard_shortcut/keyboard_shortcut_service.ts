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
  KeyboardShortcutSetup,
  KeyboardShortcutStart,
  KeyboardShortcutConfig,
  ShortcutDefinition,
} from './types';

/**
 * @internal
 * @experimental
 */
export class KeyboardShortcutService {
  private shortcutsMapByKey = new Map<string, ShortcutDefinition[]>();
  private namespacedIdToKeyLookup = new Map<string, string>();
  private config: KeyboardShortcutConfig = { enabled: true };

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

  private getNormalizedKey = (str: string): string => str.toLowerCase();

  private getNamespacedId = (shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>) =>
    `${shortcut.id.toLowerCase()}.${shortcut.pluginId.toLowerCase()}`;

  private getEventKeyString = (event: KeyboardEvent): string => {
    let key = '';

    if (event.ctrlKey) {
      key += 'ctrl+';
    }

    if (event.altKey) {
      key += 'alt+';
    }

    if (event.shiftKey) {
      key += 'shift+';
    }

    if (event.metaKey) {
      key += 'cmd+';
    }

    key += this.getNormalizedKey(event.key);

    return key;
  };

  private register(shortcut: ShortcutDefinition): void {
    if (!this.config.enabled) {
      return;
    }

    const key = this.getNormalizedKey(shortcut.keys);
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

    const tagName = target.tagName;

    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      return true;
    }

    return false;
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (this.shouldIgnoreKeyboardEventForTarget(event.target)) {
      return;
    }

    const eventKeyString = this.getEventKeyString(event);
    const shortcuts = this.shortcutsMapByKey.get(eventKeyString);

    if (shortcuts?.length) {
      // Prevent browser-specific keybindings if they conflict with our shortcuts
      event.preventDefault();

      const shortcut = shortcuts[shortcuts.length - 1];
      try {
        shortcut.execute();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Error executing keyboard shortcut ${this.getNamespacedId(shortcut)}:`,
          error
        );
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
