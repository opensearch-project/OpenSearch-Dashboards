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

import { KeyboardShortcutsSetup, KeyboardShortcutsStart, ShortcutDefinition } from './types';

/** @internal */
export class KeyboardShortcutsService {
  // Phase 1.6: Basic Registration System - Simple shortcut storage
  private shortcuts = new Map<string, ShortcutDefinition>();
  private isListening = false;

  // Phase 1.2: Basic Service Class Structure
  public setup(): KeyboardShortcutsSetup {
    return {
      register: (shortcuts) => this.register(shortcuts),
    };
  }

  public start(): KeyboardShortcutsStart {
    // Phase 1.4: Basic Event Listener Setup
    this.startEventListening();

    return {
      register: (shortcuts) => this.register(shortcuts),
      unregister: (id) => this.unregister(id),
    };
  }

  public stop() {
    this.stopEventListening();
    this.shortcuts.clear();
  }

  // Phase 1.6: Basic Registration System
  private register(shortcuts: ShortcutDefinition[]): string[] {
    const registeredIds: string[] = [];

    shortcuts.forEach((shortcut) => {
      // Construct full ID: shortcut.id + "." + shortcut.pluginId
      const fullId = `${shortcut.id}.${shortcut.pluginId}`;
      
      // Basic storage - no validation in Phase 1
      this.shortcuts.set(shortcut.keys.toLowerCase(), shortcut);
      registeredIds.push(fullId);
    });

    return registeredIds;
  }

  private unregister(fullId: string): void {
    // Find and remove shortcut by full ID
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (`${shortcut.id}.${shortcut.pluginId}` === fullId) {
        this.shortcuts.delete(key);
        return;
      }
    }
  }

  // Phase 1.5: Input Context Filtering - Text input detection
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

  // Phase 1.7: Global Shortcut Execution - Basic shortcut execution
  private handleKeyboardEvent = (event: KeyboardEvent): void => {
    // Phase 1.5: Skip if typing in text input
    if (this.isTextInputActive(event.target)) {
      return;
    }

    // Basic key matching - no normalization in Phase 1
    const eventKeyString = `${event.ctrlKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${
      event.shiftKey ? 'shift+' : ''
    }${event.metaKey ? 'cmd+' : ''}${event.key.toLowerCase()}`;

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

  // Phase 1.4: Basic Event Listener Setup - Global event handling
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
}
