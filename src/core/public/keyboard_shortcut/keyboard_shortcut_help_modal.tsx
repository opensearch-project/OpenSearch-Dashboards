/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { i18n } from '@osd/i18n';
import { ShortcutDefinition } from './types';
import { KeyboardShortcutService } from './keyboard_shortcut_service';
import { KeyStringParser } from './key_parser';
import { DISPLAY_MAPPINGS } from './constants';
import { KEYBOARD_KEY_STYLE } from './styles';
import { useKeyboardShortcut } from './use_keyboard_shortcut';

interface ShortcutItem {
  name: string;
  keys: string;
  category: string;
}

const LAYOUT_STYLES = {
  twoColumnRow: { display: 'flex', gap: '24px', marginBottom: '16px' },
  column: { flex: 1 },
  keyContainer: { display: 'flex', gap: '2px', alignItems: 'center' },
  sequenceContainer: { display: 'flex', gap: '4px', alignItems: 'center' },
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

interface KeyboardShortcutHelpModalProps {
  trigger?: React.ReactElement;
  keyboardShortcutService?:
    | KeyboardShortcutService
    | { getAllShortcuts: () => ShortcutDefinition[] };
}

export const KeyboardShortcutHelpModal: React.FC<KeyboardShortcutHelpModalProps> = ({
  trigger,
  keyboardShortcutService,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>([]);

  const keyParser = useMemo(() => new KeyStringParser(), []);
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac'),
    []
  );

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

  // Register keyboard shortcut to open modal
  useKeyboardShortcut(
    {
      id: 'show_help',
      pluginId: 'core',
      name: i18n.translate('core.keyboardShortcut.showHelp.name', {
        defaultMessage: 'Show this help',
      }),
      category: i18n.translate('core.keyboardShortcut.category.navigation', {
        defaultMessage: 'Navigation',
      }),
      keys: 'shift+/',
      execute: showModal,
    },
    keyboardShortcutService as KeyboardShortcutService
  );

  const renderSequenceKeys = useCallback((keys: string) => {
    const sequenceParts = keys.split(' ').filter((part) => part.trim() !== '');
    return (
      <div style={LAYOUT_STYLES.sequenceContainer}>
        {sequenceParts.map((key, index) => (
          <kbd key={index} style={KEYBOARD_KEY_STYLE}>
            {key.toUpperCase()}
          </kbd>
        ))}
      </div>
    );
  }, []);

  const renderMacKeys = useCallback((displayString: string) => {
    const keyParts: string[] = [];
    let currentKey = '';
    const macSymbolsSet = new Set(Object.values(DISPLAY_MAPPINGS.mac) as string[]);

    for (let i = 0; i < displayString.length; i++) {
      const char = displayString[i];
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

    if (currentKey) {
      keyParts.push(currentKey);
    }

    return (
      <div style={LAYOUT_STYLES.keyContainer}>
        {keyParts.map((key, index) => (
          <kbd key={index} style={KEYBOARD_KEY_STYLE}>
            {key}
          </kbd>
        ))}
      </div>
    );
  }, []);

  const renderOtherPlatformKeys = useCallback((displayString: string) => {
    const keyParts = displayString.split('+');
    return (
      <div style={LAYOUT_STYLES.keyContainer}>
        {keyParts.map((key, index) => (
          <kbd key={index} style={KEYBOARD_KEY_STYLE}>
            {key}
          </kbd>
        ))}
      </div>
    );
  }, []);

  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  const columns = useMemo(
    () => [
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
          const isSequence = keys.includes(' ') && !keys.includes('+');

          if (isSequence) {
            return renderSequenceKeys(keys);
          }

          const displayString = keyParser.getDisplayString(keys);
          return isMac ? renderMacKeys(displayString) : renderOtherPlatformKeys(displayString);
        },
      },
    ],
    [keyParser, isMac, renderSequenceKeys, renderMacKeys, renderOtherPlatformKeys]
  );

  const renderCategoryTable = useCallback(
    (category: string, categoryShortcuts: ShortcutItem[]) => {
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
    },
    [columns]
  );

  const renderCategoriesLayout = useCallback(() => {
    const categoryEntries = Object.entries(groupedShortcuts);
    const rows: JSX.Element[] = [];

    for (let i = 0; i < categoryEntries.length; i += 2) {
      const leftCategory = categoryEntries[i];
      const rightCategory = categoryEntries[i + 1];

      rows.push(
        <div key={`row-${i}`} style={LAYOUT_STYLES.twoColumnRow}>
          <div style={LAYOUT_STYLES.column}>
            {renderCategoryTable(leftCategory[0], leftCategory[1])}
          </div>
          <div style={LAYOUT_STYLES.column}>
            {rightCategory ? renderCategoryTable(rightCategory[0], rightCategory[1]) : <div />}
          </div>
        </div>
      );
    }

    return <div>{rows}</div>;
  }, [groupedShortcuts, renderCategoryTable]);

  return (
    <>
      {trigger &&
        React.cloneElement(trigger, {
          onClick: showModal,
          'data-modal-open': isModalVisible,
        })}
      {isModalVisible &&
        createPortal(
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

            <EuiModalBody>{renderCategoriesLayout()}</EuiModalBody>

            <EuiModalFooter>
              <EuiButton onClick={closeModal} fill data-test-subj="keyboardShortcutsCloseButton">
                <FormattedMessage
                  id="core.keyboardShortcut.helpModal.closeButton"
                  defaultMessage="Close"
                />
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>,
          document.body
        )}
    </>
  );
};
