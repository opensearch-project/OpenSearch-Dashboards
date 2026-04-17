/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { KeyboardShortcutHelpModal, CoreStart } from '../../../../core/public';

interface HelpIconProps {
  core?: CoreStart;
}

export function HelpIcon({ core }: HelpIconProps) {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const shortcutTriggerRef = useRef<HTMLSpanElement>(null);

  const tooltipContent = i18n.translate('management.helpIcon.tooltip', {
    defaultMessage: 'Help',
  });

  const togglePopover = useCallback(() => setPopoverOpen((prev) => !prev), []);
  const closePopover = useCallback(() => setPopoverOpen(false), []);

  const openShortcutModal = useCallback(() => {
    closePopover();
    // Programmatically click the hidden trigger to open the modal
    shortcutTriggerRef.current?.click();
  }, [closePopover]);

  const button = (
    <EuiToolTip content={tooltipContent} position="right">
      <EuiButtonIcon
        aria-label={tooltipContent}
        iconType="questionInCircle"
        onClick={togglePopover}
        color="text"
        data-test-subj="helpIcon"
      />
    </EuiToolTip>
  );

  const items = [
    <EuiContextMenuItem
      key="keyboard-shortcuts"
      icon="keyboardShortcut"
      onClick={openShortcutModal}
      data-test-subj="helpIconKeyboardShortcuts"
    >
      {i18n.translate('management.helpIcon.keyboardShortcuts', {
        defaultMessage: 'Keyboard shortcuts',
      })}
    </EuiContextMenuItem>,
  ];

  return (
    <>
      <EuiPopover
        id="helpIconPopover"
        button={button}
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="rightUp"
        ownFocus={false}
        panelPaddingSize="none"
      >
        <EuiContextMenuPanel hasFocus={false} size="s" items={items} />
      </EuiPopover>
      {/* Hidden trigger for KeyboardShortcutHelpModal — uses the trigger/cloneElement pattern */}
      <KeyboardShortcutHelpModal
        trigger={<span ref={shortcutTriggerRef} style={{ display: 'none' }} />}
        keyboardShortcutService={core?.keyboardShortcut}
      />
    </>
  );
}
