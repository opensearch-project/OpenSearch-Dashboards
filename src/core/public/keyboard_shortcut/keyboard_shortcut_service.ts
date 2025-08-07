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

  private register(shortcuts: ShortcutDefinition[]): void {
    shortcuts.forEach((shortcut) => {
      this.shortcuts.set(this.normalizeKeyboardShortcutString(shortcut.keys), shortcut);
    });
  }

  private unregister(fullId: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (this.getNamespacedIdForKeyboardShortcut(shortcut) === fullId) {
        this.shortcuts.delete(key);
        return;
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
    const shortcut = this.shortcuts.get(eventKeyString);

    if (shortcut) {
      event.preventDefault();

      try {
        shortcut.execute();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Error executing keyboard shortcut ${this.getNamespacedIdForKeyboardShortcut(shortcut)}:`,
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
