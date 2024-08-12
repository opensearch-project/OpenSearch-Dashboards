/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';

export interface Props {
  onClick: () => void;
  isCollapsed: boolean;
}

export function QueryEditorBtnCollapse({ onClick, isCollapsed }: Props) {
  const label = i18n.translate('queryEditor.collapse', {
    defaultMessage: 'Toggle query editor',
  });
  return (
    <div className="osdQueryEditor__collapseBtn">
      <EuiToolTip content={label}>
        <EuiButtonIcon
          aria-expanded={!isCollapsed}
          aria-label={label}
          data-test-subj="queryEditorCollapseBtn"
          onClick={onClick}
          iconType={!isCollapsed ? 'arrowRight' : 'arrowDown'}
          iconSize={'m'}
        />
      </EuiToolTip>
    </div>
  );
}
