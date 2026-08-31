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
import { useKeyboardShortcut } from './use_keyboard_shortcut';

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
      useKeyboardShortcut: (shortcut) => useKeyboardShortcut(shortcut, this),
      getAllShortcuts: () => this.getAllShortcuts(),
    };
  }

  public stop() {
    this.stopEventListener();
    this.shortcutsMapByKey.clear();
    this.namespacedIdToKeyLookup.clear();
    this.sequenceHandler.cancel();
  }

  private getNamespacedId = (shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>) =>
    `${shortcut.id.toLowerCase()}.${shortcut.pluginId.toLowerCase()}`;

  public register(shortcut: ShortcutDefinition): void {
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
            `The last eligible shortcut will take precedence when the key is pressed.`
        );
      }
    }

    this.shortcutsMapByKey.set(key, [...existingShortcuts, shortcut]);
    this.namespacedIdToKeyLookup.set(namespacedId, key);
  }

  public unregister(shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>): void {
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

  private isEditableTarget(target: EventTarget | null): boolean {
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
    if (!shortcuts?.length) {
      return;
    }

    const targetIsEditable = this.isEditableTarget(event.target);

    for (let index = shortcuts.length - 1; index >= 0; index--) {
      const shortcut = shortcuts[index];

      if (targetIsEditable && !shortcut.allowInEditable) {
        continue;
      }

      this.executeShortcut(event, shortcut);
      return;
    }
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    const eventKeyString = this.keyParser.getEventKeyString(event);
    const targetIsEditable = this.isEditableTarget(event.target);

    if (this.sequenceHandler.isInSequence()) {
      // A pending sequence owns the next key. Execution is still subject to the
      // shortcut's editable-target policy in executeShortcutForKey().
      const sequenceKey = this.sequenceHandler.processSecondKey(eventKeyString);
      this.executeShortcutForKey(event, sequenceKey);
      return;
    }

    // Text entry must not create sequence state that can later trigger a
    // navigation shortcut after focus leaves the editable element.
    if (!targetIsEditable && SEQUENCE_PREFIX.has(eventKeyString)) {
      this.sequenceHandler.processFirstKey(eventKeyString);
      return;
    }

    this.executeShortcutForKey(event, eventKeyString);
  };

  private startEventListener(): void {
    document.addEventListener('keydown', this.handleKeyboardEvent, true);
  }

  private stopEventListener(): void {
    document.removeEventListener('keydown', this.handleKeyboardEvent, true);
  }

  public getAllShortcuts(): ShortcutDefinition[] {
    const allShortcuts: ShortcutDefinition[] = [];

    // Iterate through all shortcuts in the map and collect all shortcuts
    for (const shortcuts of this.shortcutsMapByKey.values()) {
      allShortcuts.push(...shortcuts);
    }

    return allShortcuts;
  }
}
