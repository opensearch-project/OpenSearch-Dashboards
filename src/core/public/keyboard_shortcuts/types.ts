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

// Core Type Definitions

export interface KeyboardShortcutsSetup {
  register(shortcuts: ShortcutDefinition[]): string[];
}

export interface KeyboardShortcutsStart {
  register(shortcuts: ShortcutDefinition[]): string[];
  unregister(id: string): void;
}

export interface ShortcutDefinition {
  id: string;
  pluginId: string;
  name: string;
  category: string;
  keys: string;
  execute: ShortcutHandler;
}

export type ShortcutHandler = (event: KeyboardEvent) => void | Promise<void>;
