/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration for keyboard shortcuts
 * @public
 */
export interface KeyboardShortcutConfig {
  /**
   * Whether keyboard shortcuts are enabled
   */
  enabled: boolean;
}

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
   * Format: 'cmd+s', 'shift+d', 'alt+enter', etc.
   * Case-insensitive, normalized internally
   */
  keys: string;

  /**
   * Function to execute when the shortcut is triggered
   */
  execute: () => void;
}

/**
 * Keys that can be displayed with special symbols or formatting.
 * Includes both modifier keys and special keys that have platform-specific display representations.
 * Used to generate user-friendly display strings (e.g., '⌘' for 'cmd' on Mac).
 */
export type DisplayMappingKeys =
  | 'ctrl'
  | 'alt'
  | 'shift'
  | 'cmd'
  | 'enter'
  | 'backspace'
  | 'delete'
  | 'tab'
  | 'escape'
  | 'space'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'plus';

/**
 * Platform-specific display representations for keys.
 * Maps key names to their visual representation for each platform.
 *
 * @example
 * // Mac: 'cmd' → '⌘', 'shift' → '⇧', 'up' → '↑'
 * // Windows/Linux: 'cmd' → 'Ctrl', 'shift' → 'Shift', 'up' → '↑'
 */
export interface PlatformDisplayMappings {
  readonly mac: Record<DisplayMappingKeys, string>;
  readonly other: Record<DisplayMappingKeys, string>;
}
