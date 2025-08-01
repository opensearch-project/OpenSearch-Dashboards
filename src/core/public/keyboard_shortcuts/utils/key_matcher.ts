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

import { ShortcutDefinition } from '../types';

/**
 * Converts keyboard event to standardized key string format
 * Examples: 'ctrl+s', 'cmd+shift+z', 'alt+enter', 'r'
 */
export const eventToKeyString = (event: KeyboardEvent): string => {
  let result = '';
  if (event.ctrlKey) result += 'ctrl+';
  if (event.altKey) result += 'alt+';
  if (event.shiftKey) result += 'shift+';
  if (event.metaKey) result += 'cmd+';
  result += event.key.toLowerCase();
  return result;
};

/**
 * Finds all shortcuts that match the current keyboard event
 * Returns all matches - context-aware resolution will handle prioritization
 */
export const findMatchingShortcuts = (
  event: KeyboardEvent,
  shortcuts: Map<string, ShortcutDefinition>
): ShortcutDefinition[] => {
  const eventKey = eventToKeyString(event);
  return Array.from(shortcuts.values()).filter(
    shortcut => shortcut.keys === eventKey
  );
};
