/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';

const CodeToggleIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" />
  </svg>
);

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
