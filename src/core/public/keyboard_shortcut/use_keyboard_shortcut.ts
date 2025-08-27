/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { ShortcutDefinition } from './types';
import { KeyboardShortcutService } from './keyboard_shortcut_service';

/**
 * Hook for registering a single keyboard shortcut in functional React components
 *
 * Most uses: keyboardShortcut?.useKeyboardShortcut({...})
 * This hook is for React components that want automatic cleanup and optimized re-registration.
 *
 * Avoid inline functions as they create new references on every render.
 * @param shortcut - Shortcut definition to register
 * @param keyboardShortcutService - The keyboard shortcut service from CoreStart
 *
 * @example
 * ```typescript
 *
 * // Static function (memoized)
 * const handleSave = () => {
 *  console.log('Save!');
 *  };
 *
 * function MyComponent() {
 *   const { keyboardShortcut } = opensearchDashboards.services;
 *
 *   keyboardShortcut?.useKeyboardShortcut({
 *     id: 'save',
 *     pluginId: 'myPlugin',
 *     name: 'Save',
 *     category: 'editing',
 *     keys: 'cmd+s',
 *     execute: handleSave
 *   });
 * }
 *
 */
export function useKeyboardShortcut(
  shortcut: ShortcutDefinition,
  keyboardShortcutService: KeyboardShortcutService
) {
  useEffect(() => {
    if (!keyboardShortcutService) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`keyboardShortcutService is not available.`);
      }
      return;
    }

    // Register the shortcut
    keyboardShortcutService.register(shortcut);

    // Cleanup function - unregister the shortcut when component unmounts
    // or when shortcut definition changes
    return () => {
      try {
        keyboardShortcutService.unregister({
          id: shortcut.id,
          pluginId: shortcut.pluginId,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to unregister shortcut ${shortcut.id}:`, error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    keyboardShortcutService,
    shortcut.id,
    shortcut.pluginId,
    shortcut.name,
    shortcut.category,
    shortcut.keys,
    shortcut.execute,
  ]);
}
