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
import { SequenceHandler } from './sequence_handler';
import { SEQUENCE_PREFIX } from './constants';

/**
 * @internal
 * @experimental
 */
export class KeyboardShortcutService {
  private shortcutsMapByKey = new Map<string, ShortcutDefinition[]>();
  private namespacedIdToKeyLookup = new Map<string, string>();
  private config: KeyboardShortcutConfig = { enabled: true };
  private keyParser = new KeyStringParser();
  private sequenceHandler = new SequenceHandler();

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
    this.sequenceHandler = new SequenceHandler();
  }

  private getNamespacedId = (shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>) =>
    `${shortcut.id.toLowerCase()}.${shortcut.pluginId.toLowerCase()}`;

  private register(shortcut: ShortcutDefinition): void {
    if (!this.config.enabled) {
      return;
    }

    const namespacedId = this.getNamespacedId(shortcut);

    if (this.namespacedIdToKeyLookup.has(namespacedId)) {
      throw new Error(
        `Shortcut "${shortcut.id}" from plugin "${shortcut.pluginId}" is already registered`
      );
    }

    const key = shortcut.keys.includes(' ')
      ? this.sequenceHandler.normalizeKeyString(shortcut.keys)
      : this.keyParser.normalizeKeyString(shortcut.keys);

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
      (existingShortcut) => this.getNamespacedId(existingShortcut) !== namespacedId
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

  private executeShortcutForKey(event: KeyboardEvent, key: string): void {
    const shortcuts = this.shortcutsMapByKey.get(key);
    if (shortcuts?.length) {
      const shortcut = shortcuts[shortcuts.length - 1];
      this.executeShortcut(event, shortcut);
    }
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (this.shouldIgnoreKeyboardEventForTarget(event.target)) {
      return;
    }

    const eventKeyString = this.keyParser.getEventKeyString(event);

    // Check if sequence handler already has a first key (waiting for second key)
    if (this.sequenceHandler.isInSequence()) {
      const sequenceKey = this.sequenceHandler.processSecondKey(eventKeyString);
      this.executeShortcutForKey(event, sequenceKey);
    } else if (SEQUENCE_PREFIX.has(eventKeyString)) {
      this.sequenceHandler.processFirstKey(eventKeyString);
    } else {
      // Process as regular shortcut (including modifier keys and single keys)
      this.executeShortcutForKey(event, eventKeyString);
    }
  };

  private startEventListener(): void {
    document.addEventListener('keydown', this.handleKeyboardEvent, true);
  }

  private stopEventListener(): void {
    document.removeEventListener('keydown', this.handleKeyboardEvent, true);
  }
}
