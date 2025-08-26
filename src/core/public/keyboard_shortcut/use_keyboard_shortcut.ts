/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { ShortcutDefinition, KeyboardShortcutStart } from './types';

interface UseKeyboardShortcutProps {
  shortcut: ShortcutDefinition;
  keyboardShortcutService: KeyboardShortcutStart | null;
  dependencies?: React.DependencyList;
}

/**
 * Hook for registering a single keyboard shortcut in functional React components
 *
 * This is the recommended approach for registering shortcuts as it:
 * - Provides clear error isolation (one shortcut failure doesn't affect others)
 * - Lets programming errors crash immediately (forcing developers to fix issues)
 * - Eliminates complex loop logic and error handling
 * - Makes debugging easier with clear error sources
 *
 * @param shortcut - Single shortcut definition to register
 * @param keyboardShortcutService - The keyboard shortcut service from CoreStart
 * @param dependencies - Optional React dependency array. When any dependency changes,
 *                       the shortcut is re-registered. Use this when shortcut behavior
 *                       depends on component state/props that can change.
 *
 * @example
 * ```typescript
 * // Example 1: Static shortcut (no dependencies needed)
 * function HelpComponent() {
 *   const { keyboardShortcut } = useOpenSearchDashboards().services;
 *
 *   useKeyboardShortcut({
 *     shortcut: {
 *       id: 'showHelp',
 *       pluginId: 'myPlugin',
 *       name: 'Show Help',
 *       category: 'navigation',
 *       keys: 'shift+/',
 *       execute: () => showHelpDialog() // Static function - no state dependencies
 *     },
 *     keyboardShortcutService: keyboardShortcut
 *   });
 * }
 *
 * // Example 2: Dynamic shortcut (dependencies needed)
 * function EditorComponent({ user }) {
 *   const [content, setContent] = useState('');
 *   const [isFocused, setIsFocused] = useState(false);
 *
 *   useKeyboardShortcut({
 *     shortcut: {
 *       id: 'save',
 *       pluginId: 'editor',
 *       name: 'Save Content',
 *       category: 'editing',
 *       keys: 'cmd+s',
 *       execute: () => {
 *         if (user.canEdit && isFocused) { // Uses component state
 *           saveContent(content);
 *         }
 *       }
 *     },
 *     keyboardShortcutService: keyboardShortcut,
 *     dependencies: [user.canEdit, isFocused, content] // Re-register when these change
 *   });
 * }
 *
 * // Example 3: Multiple shortcuts (use multiple hooks)
 * function TextEditor() {
 *   const { keyboardShortcut } = useOpenSearchDashboards().services;
 *
 *   useKeyboardShortcut({
 *     shortcut: {
 *       id: 'save',
 *       pluginId: 'textEditor',
 *       name: 'Save Document',
 *       category: 'editing',
 *       keys: 'cmd+s',
 *       execute: () => save()
 *     },
 *     keyboardShortcutService: keyboardShortcut
 *   });
 *
 *   useKeyboardShortcut({
 *     shortcut: {
 *       id: 'copy',
 *       pluginId: 'textEditor',
 *       name: 'Copy Text',
 *       category: 'editing',
 *       keys: 'cmd+c',
 *       execute: () => copy()
 *     },
 *     keyboardShortcutService: keyboardShortcut
 *   });
 *
 *   useKeyboardShortcut({
 *     shortcut: {
 *       id: 'paste',
 *       pluginId: 'textEditor',
 *       name: 'Paste Text',
 *       category: 'editing',
 *       keys: 'cmd+v',
 *       execute: () => paste()
 *     },
 *     keyboardShortcutService: keyboardShortcut
 *   });
 * }
 * ```
 */
export function useKeyboardShortcut({
  shortcut,
  keyboardShortcutService,
  dependencies = [],
}: UseKeyboardShortcutProps) {
  useEffect(() => {
    if (!keyboardShortcutService) {
      return;
    }
    keyboardShortcutService.register(shortcut);

    // Cleanup function - unregister the shortcut
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
  }, [keyboardShortcutService, shortcut, ...(dependencies || [])]);
}
