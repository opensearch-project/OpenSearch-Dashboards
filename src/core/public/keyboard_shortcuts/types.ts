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

export interface KeyboardShortcutsSetup {
  /**
   * Register keyboard shortcuts
   * @param shortcuts - Array of shortcut definitions
   * @returns Array of shortcut IDs
   */
  register(shortcuts: ShortcutDefinition[]): string[];
}

export interface KeyboardShortcutsStart {
  /**
   * Register keyboard shortcuts
   * @param shortcuts - Array of shortcut definitions
   * @returns Array of shortcut IDs
   */
  register(shortcuts: ShortcutDefinition[]): string[];

  /**
   * Get all registered shortcuts
   */
  //getAllShortcuts(): ShortcutDefinition[];

  /**
   * Get all currently registered shortcuts for help modal
   * Returns shortcuts that are currently in the registry (automatically context-aware)
   */
  getAllRegisteredShortcuts(): ShortcutDefinition[];

  /**
   * Get shortcuts by category
   * @param category - Category name
   */
  getShortcutsByCategory(category: string): ShortcutDefinition[];

  /**
   * Show keyboard shortcuts help modal
   */
  showHelpModal(): void;


  /**
   * Unregister a shortcut
   * @param id - Shortcut ID to remove
   */
  unregister(id: string): void;
}



export interface ShortcutDefinition {
  /** 
   * Unique identifier for the shortcut within the plugin (e.g., 'search', 'save')
   * 
   * The final ID will be constructed as: id + "." + pluginId
   * Example: 'search.discover', 'save.dashboard'
   */
  id: string;
  /** Plugin identifier that owns this shortcut */
  pluginId: string;
  /** Human-readable name (used for help menu) */
  name: string;
  /** Category for grouping (e.g., 'navigation', 'editing') */
  category: string;
  /** 
   * Key combination string (e.g., 'ctrl+s', 'g+d', 'shift+?', 'escape')
   * 
   * Supported formats:
   * - Modifier + key: 'ctrl+s', 'shift+?', 'alt+f'
   * - Multiple modifiers: 'ctrl+shift+z', 'ctrl+alt+d'
   * - Sequences: 'g+d', 'g+h' (two-key sequences)
   * 
   * Cross-platform: 'ctrl' automatically maps to 'cmd' on macOS
   */
  keys: string;
  
  /** Function to execute when shortcut is triggered */
  execute: ShortcutHandler;
  /** Optional condition function that determines if shortcut is active */
  condition?: ConditionFunction;

}


export type ShortcutHandler = (event: KeyboardEvent) => void | Promise<void>;
export type ConditionFunction = () => boolean;


/** 
 * @internal 
 * Dependencies required by the keyboard shortcuts service during the start lifecycle phase.
 * These services are injected by the core system to provide necessary functionality.
 */
export interface StartDeps {
  /** Application service for navigation and app-level operations */
  application: any;
  /** Chrome service for browser chrome interactions (header, navigation, etc.) */
  chrome: any;
  /** Overlays service for managing modals, flyouts, and other overlay UI components */
  overlays: any;
}
