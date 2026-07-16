/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { CodeToggleIcon } from './icons';

interface ModeToggleButtonProps {
  isCode: boolean;
  onToggle: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({
  isCode,
  onToggle,
  disabled,
  tooltip,
}) => {
  const label = isCode
    ? i18n.translate('explore.pplBuilder.switchToBuilder', { defaultMessage: 'Builder mode' })
    : i18n.translate('explore.pplBuilder.switchToCode', { defaultMessage: 'Code mode' });
  return (
    <EuiToolTip content={tooltip ?? label} position="top">
      <EuiButtonIcon
        className={`plqIconBtn${isCode ? ' plqIconBtn--active' : ''}`}
        iconType={CodeToggleIcon}
        color="text"
        size="s"
        isDisabled={disabled}
        onClick={onToggle}
        aria-label={label}
        data-test-subj="pplBuilderModeToggle"
      />
    </EuiToolTip>
  );
};
