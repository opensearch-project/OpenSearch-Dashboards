/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { KeyboardShortcutHelpModal, CoreStart } from '../../../../core/public';

interface KeyboardShortcutIconProps {
  core?: CoreStart;
}

export function KeyboardShortcutIcon({ core }: KeyboardShortcutIconProps) {
  const tooltipContent = i18n.translate('management.keyboardShortcut.icon.nav.title', {
    defaultMessage: 'Keyboard shortcuts',
  });

  const IconWithTooltip = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
    const isModalOpen = props['data-modal-open'];

    const button = (
      <EuiButtonIcon
        {...props}
        ref={ref}
        aria-label={tooltipContent}
        iconType="keyboardShortcut"
        color="text"
      />
    );

    // Don't show tooltip when modal is open
    if (isModalOpen) {
      return button;
    }

    return <EuiToolTip content={tooltipContent}>{button}</EuiToolTip>;
  });

  return (
    <KeyboardShortcutHelpModal
      trigger={<IconWithTooltip />}
      keyboardShortcutService={core?.keyboardShortcut}
    />
  );
}
