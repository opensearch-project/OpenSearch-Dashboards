/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { CodeToggleIcon } from './icons';

interface ModeToggleButtonProps {
  /** True when the code editor is showing (button reads as active). */
  isCode: boolean;
  /** Toggle between builder and code. */
  onToggle: () => void;
  /** Disable the toggle (e.g. a code query that can't round-trip to builder). */
  disabled?: boolean;
  /** Overrides the hover tooltip (e.g. the "can't switch" explanation). */
  tooltip?: string;
}

/**
 * The `</>` builder/code toggle used both inside the builder's search row and,
 * in code mode, pinned top-right of the editor. Replaces the old two-button
 * EuiButtonGroup: a single compact icon whose active (filled) state indicates
 * code mode. The tooltip names the mode it switches to.
 */
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
