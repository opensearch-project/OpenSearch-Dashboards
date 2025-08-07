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

import { KeyboardShortcutSetup, KeyboardShortcutStart, ShortcutDefinition } from './types';

/**
 * @internal
 * @experimental
 */
export class KeyboardShortcutService {
  private shortcuts = new Map<string, ShortcutDefinition>();

  public setup(): KeyboardShortcutSetup {
    return {
      register: (shortcuts) => this.register(shortcuts),
    };
  }

  public start(): KeyboardShortcutStart {
    this.startEventListener();

    return {
      register: (shortcuts) => this.register(shortcuts),
      unregister: (id) => this.unregister(id),
    };
  }

  public stop() {
    this.stopEventListener();
    this.shortcuts.clear();
  }

  private normalizeKeyboardShortcutString = (str: string): string => str.toLowerCase();

  private getNamespacedIdForKeyboardShortcut = (
    shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>
  ) =>
    `${this.normalizeKeyboardShortcutString(shortcut.id)}.${this.normalizeKeyboardShortcutString(
      shortcut.pluginId
    )}`;

  private getEventKeyString = (event: KeyboardEvent): string => {
    return `${event.ctrlKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${
      event.shiftKey ? 'shift+' : ''
    }${event.metaKey ? 'cmd+' : ''}${this.normalizeKeyboardShortcutString(event.key)}`;
  };

  private register(shortcuts: ShortcutDefinition[]): string[] {
    const registeredIds: string[] = [];

    shortcuts.forEach((shortcut) => {
      const fullId = this.getNamespacedIdForKeyboardShortcut(shortcut);
      this.shortcuts.set(this.normalizeKeyboardShortcutString(shortcut.keys), shortcut);
      registeredIds.push(fullId);
    });

    return registeredIds;
  }

  private unregister(fullId: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (this.getNamespacedIdForKeyboardShortcut(shortcut) === fullId) {
        this.shortcuts.delete(key);
        return;
      }
    }
  }

  private isTextInputActive(target: EventTarget | null): boolean {
    if (!target || !(target as HTMLElement).tagName) return false;

    const element = target as HTMLElement;
    const tagName = this.normalizeKeyboardShortcutString(element.tagName);

    if (tagName === 'input' || tagName === 'textarea') {
      return true;
    }

    if (element.contentEditable === 'true') return true;

    return false;
  }

  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (this.isTextInputActive(event.target)) {
      return;
    }

    const eventKeyString = this.getEventKeyString(event);
    const shortcut = this.shortcuts.get(eventKeyString);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();

      try {
        shortcut.execute(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error executing keyboard shortcut ${shortcut.id}:`, error);
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
