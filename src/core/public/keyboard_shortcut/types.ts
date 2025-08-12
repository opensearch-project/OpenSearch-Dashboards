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

export interface KeyboardShortcutSetup {
  register(shortcut: ShortcutDefinition): void;
}

export interface KeyboardShortcutStart {
  register(shortcut: ShortcutDefinition): void;
  unregister(shortcut: Pick<ShortcutDefinition, 'id' | 'pluginId'>): void;
}

/**
 * A keyboard shortcut definition that plugins can register with the core system
 * @public
 */
export interface ShortcutDefinition {
  /**
   * Unique identifier for the shortcut within the plugin
   * Combined with pluginId to create a globally unique identifier
   */
  id: string;

  /**
   * The plugin that owns this shortcut
   * Used for namespacing and cleanup when plugins are disabled
   */
  pluginId: string;

  /**
   * Human-readable name for the shortcut
   * Used for documentation and help systems
   */
  name: string;

  /**
   * Category to group related shortcuts together
   * Examples: 'navigation', 'editing', 'view'
   */
  category: string;

  /**
   * Key combination that triggers the shortcut
   * Format: 'ctrl+s', 'shift+d', 'alt+enter', etc.
   * Case-insensitive, normalized internally
   */
  keys: string;

  /**
   * Function to execute when the shortcut is triggered
   * Can be async for operations that require API calls
   */
  execute: () => void | Promise<void>;
}
