/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiBasicTable,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { ShortcutDefinition } from './types';
import { KeyboardShortcutService } from './keyboard_shortcut_service';
import { KeyStringParser } from './key_parser';
import { DISPLAY_MAPPINGS } from './constants';
import { useKeyboardShortcut } from './use_keyboard_shortcut';

interface ShortcutItem {
  name: string;
  keys: string;
  category: string;
}

const KEYBOARD_KEY_STYLE = {
  display: 'inline-block',
  padding: '2px 6px',
  fontSize: '11px',
  lineHeight: '1.4',
  color: '#24292f',
  backgroundColor: '#f6f8fa',
  border: '1px solid #d0d7de',
  borderRadius: '6px',
  boxShadow: 'inset 0 -1px 0 #d0d7de',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: '400',
  minWidth: '20px',
  textAlign: 'center' as const,
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const groupShortcutsByCategory = (shortcuts: ShortcutItem[]): Record<string, ShortcutItem[]> => {
  return shortcuts.reduce((groups, shortcut) => {
    const category = capitalizeFirstLetter(shortcut.category);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, ShortcutItem[]>);
};

interface KeyboardShortcutHelpProps {
  trigger?: React.ReactElement;
  keyboardShortcutService?:
    | KeyboardShortcutService
    | { getAllShortcuts: () => ShortcutDefinition[] };
}

export const KeyboardShortcutHelp: React.FC<KeyboardShortcutHelpProps> = ({
  trigger,
  keyboardShortcutService,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);
  const keyParser = new KeyStringParser();

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // Handle click outside modal
  useEffect(() => {
    if (!isModalVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const modalElement = document.querySelector('[data-test-subj="keyboardShortcutsModal"]');
      if (modalElement && !modalElement.contains(event.target as Node)) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalVisible, closeModal]);

  const loadShortcuts = useCallback(() => {
    if (keyboardShortcutService) {
      try {
        const registeredShortcuts = keyboardShortcutService.getAllShortcuts();
        const shortcutItems: ShortcutItem[] = registeredShortcuts.map((shortcut) => ({
          name: shortcut.name,
          keys: shortcut.keys,
          category: shortcut.category,
        }));

        setShortcuts(shortcutItems);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Failed to get registered shortcuts:', error);
          setShortcuts([]);
        }
      }
    } else {
      // No keyboard shortcut service available
      setShortcuts([]);
    }
  }, [keyboardShortcutService]);

  const showModal = useCallback(() => {
    loadShortcuts(); // Refresh shortcuts when modal opens
    setIsModalVisible(true);
  }, [loadShortcuts]);

  // Register keyboard shortcut to open modal using the hook
  useKeyboardShortcut(
    {
      id: 'show_help',
      pluginId: 'core',
      name: 'Show this help',
      category: 'navigation',
      keys: 'shift+/',
      execute: showModal,
    },
    keyboardShortcutService as KeyboardShortcutService
  );

  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  const columns = [
    {
      field: 'name' as keyof ShortcutItem,
      name: '',
      width: '60%',
      render: (name: string) => <EuiText size="s">{name}</EuiText>,
    },
    {
      field: 'keys' as keyof ShortcutItem,
      name: '',
      width: '40%',
      render: (keys: string) => {
        try {
          // Check if this is a sequence (contains space, like "g d")
          const isSequence = keys.includes(' ') && !keys.includes('+');

          if (isSequence) {
            // Handle sequences like "g d" - split by space and show as separate buttons
            const sequenceParts = keys.split(' ').filter((part) => part.trim() !== '');
            return (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {sequenceParts.map((key, index) => (
                  <kbd key={index} style={KEYBOARD_KEY_STYLE}>
                    {key.toUpperCase()}
                  </kbd>
                ))}
              </div>
            );
          }

          // Use the KeyStringParser to get platform-appropriate display string for regular combinations
          const displayString = keyParser.getDisplayString(keys);

          const isMac =
            typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');

          if (isMac) {
            // On Mac, getDisplayString returns symbols concatenated without separators
            // We need to split this into individual key symbols
            // For example: "⌘⇧A" should become ["⌘", "⇧", "A"]
            const keyParts: string[] = [];
            let currentKey = '';

            const macSymbolsSet = new Set(Object.values(DISPLAY_MAPPINGS.mac) as string[]);

            for (let i = 0; i < displayString.length; i++) {
              const char = displayString[i];
              // Check if this is a Mac symbol (modifier key or special key)
              if (macSymbolsSet.has(char)) {
                if (currentKey) {
                  keyParts.push(currentKey);
                  currentKey = '';
                }
                keyParts.push(char);
              } else {
                currentKey += char;
              }
            }

            // Add any remaining characters as the final key
            if (currentKey) {
              keyParts.push(currentKey);
            }

            return (
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {keyParts.map((key, index) => (
                  <kbd key={index} style={KEYBOARD_KEY_STYLE}>
                    {key}
                  </kbd>
                ))}
              </div>
            );
          } else {
            // On other platforms, split by + separator
            const keyParts = displayString.split('+');
            return (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {keyParts.map((key, index) => (
                  <React.Fragment key={index}>
                    <kbd style={KEYBOARD_KEY_STYLE}>{key}</kbd>
                    {index < keyParts.length - 1 && (
                      <span style={{ fontSize: '12px', color: '#656d76', margin: '0 2px' }}>+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            );
          }
        } catch (error) {
          // Fallback to original behavior if parsing fails
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('Failed to parse key string:', keys, error);
          }
          const keyParts = keys.split(' + ');
          return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {keyParts.map((key, index) => (
                <React.Fragment key={index}>
                  <kbd style={KEYBOARD_KEY_STYLE}>{key}</kbd>
                  {index < keyParts.length - 1 && (
                    <span style={{ fontSize: '12px', color: '#656d76', margin: '0 2px' }}>+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        }
      },
    },
  ];

  const renderCategoryTable = (category: string, categoryShortcuts: ShortcutItem[]) => {
    return (
      <div key={category}>
        <EuiText>
          <h3>{category}</h3>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiBasicTable<ShortcutItem>
          items={categoryShortcuts}
          columns={columns}
          tableLayout="fixed"
          rowProps={() => ({
            style: { height: '40px' },
          })}
        />
        <EuiSpacer size="l" />
      </div>
    );
  };

  const modal = isModalVisible ? (
    <EuiModal
      onClose={closeModal}
      style={{ width: '650px', maxWidth: '90vw', borderRadius: '12px' }}
      initialFocus="[data-test-subj=keyboardShortcutsCloseButton]"
      data-test-subj="keyboardShortcutsModal"
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <FormattedMessage
            id="core.keyboardShortcut.helpModal.title"
            defaultMessage="Keyboard shortcuts"
          />
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <div>
          {(() => {
            const categoryEntries = Object.entries(groupedShortcuts);
            const categoryCount = categoryEntries.length;

            if (categoryCount === 1) {
              // Single category: display normally
              return (
                <div>
                  {categoryEntries.map(([category, categoryShortcuts]) =>
                    renderCategoryTable(category, categoryShortcuts)
                  )}
                </div>
              );
            } else {
              // Two or more categories: display in left-right-left-right pattern
              const rows: JSX.Element[] = [];

              for (let i = 0; i < categoryEntries.length; i += 2) {
                const leftCategory = categoryEntries[i];
                const rightCategory = categoryEntries[i + 1];

                rows.push(
                  <div
                    key={`row-${i}`}
                    style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}
                  >
                    <div style={{ flex: 1 }}>
                      {renderCategoryTable(leftCategory[0], leftCategory[1])}
                    </div>
                    <div style={{ flex: 1 }}>
                      {rightCategory ? (
                        renderCategoryTable(rightCategory[0], rightCategory[1])
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                );
              }

              return <div>{rows}</div>;
            }
          })()}
        </div>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton onClick={closeModal} fill data-test-subj="keyboardShortcutsCloseButton">
          <FormattedMessage
            id="core.keyboardShortcut.helpModal.closeButton"
            defaultMessage="Close"
          />
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  ) : null;

  const triggerElement = trigger
    ? React.cloneElement(trigger, {
        onClick: showModal,
        'data-modal-open': isModalVisible,
      })
    : null;

  return (
    <>
      {triggerElement}
      {modal && createPortal(modal, document.body)}
    </>
  );
};
