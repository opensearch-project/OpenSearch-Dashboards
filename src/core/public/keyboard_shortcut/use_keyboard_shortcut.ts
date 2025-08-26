/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useRef, useMemo } from 'react';
import { ShortcutDefinition, KeyboardShortcutStart } from './types';
interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutDefinition[];
  keyboardShortcutService: KeyboardShortcutStart | null;
  dependencies?: React.DependencyList;
}
/**
 * Hook for registering keyboard shortcuts in functional React components
 *
 * Provides robust error handling and cleanup logic:
 * - Continues registering other shortcuts even if some fail
 * - Tracks only successfully registered shortcuts for accurate cleanup
 * - Automatic cleanup when component unmounts or dependencies change
 *
 *
 * @param shortcuts - Array of shortcut definitions to register
 * @param keyboardShortcutService - The keyboard shortcut service from CoreStart
 * @param dependencies - React dependency array for re-registration
 * @returns Object with registered shortcut IDs
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { keyboardShortcut } = useOpenSearchDashboards().services;
 *
 *   // useMemo prevents shortcuts array from being recreated on every render
 *   // Without useMemo, useEffect would re-run constantly, causing shortcuts
 *   // to be unregistered and re-registered on every component render
 *   const shortcuts = useMemo(() => [
 *     {
 *       id: 'save',
 *       pluginId: 'myPlugin',
 *       name: 'Save Document',
 *       category: 'editing',
 *       keys: 'cmd+s',
 *       execute: () => handleSave()
 *     }
 *   ], []); // Empty deps = stable reference until component unmounts
 *
 *   const { registeredShortcutIds } = useKeyboardShortcuts({
 *     shortcuts,
 *     keyboardShortcutService: keyboardShortcut
 *   });
 *
 *   return <div>Registered {registeredShortcutIds.length} shortcuts</div>;
 * }
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  keyboardShortcutService,
  dependencies = [],
}: UseKeyboardShortcutsProps) {
  // useRef is used instead of useState for tracking registered shortcuts because:
  // We don't want to trigger re-renders when updating the tracking array
  // The cleanup function needs access to the current value (closure issue with useState)
  // Better performance - no unnecessary re-renders during registration process
  // The ref value persists across renders and is mutable without causing re-renders
  const successfullyRegistered = useRef<ShortcutDefinition[]>([]);
  useEffect(() => {
    if (!keyboardShortcutService) {
      return;
    }
    // Clear previous registrations
    successfullyRegistered.current = [];
    // Register all shortcuts and track successful ones
    // continue registering other shortcuts even if some fail
    shortcuts.forEach((shortcut) => {
      try {
        keyboardShortcutService.register(shortcut);
        successfullyRegistered.current.push(shortcut);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error(`Failed to register shortcut ${shortcut.id}:`, error);
        }
      }
    });
    // Cleanup function - only unregister successfully registered shortcuts
    return () => {
      if (keyboardShortcutService && successfullyRegistered.current.length > 0) {
        successfullyRegistered.current.forEach((shortcut) => {
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
        });
        successfullyRegistered.current = [];
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardShortcutService, shortcuts, ...(dependencies || [])]);
  return {
    registeredShortcutIds: successfullyRegistered.current.map(
      (shortcut) => `${shortcut.id}.${shortcut.pluginId}`
    ),
  };
}
