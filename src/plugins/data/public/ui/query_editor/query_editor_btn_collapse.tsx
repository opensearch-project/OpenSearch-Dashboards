/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
    <EuiToolTip content={label}>
      <EuiButtonIcon
        aria-expanded={!isCollapsed}
        aria-label={label}
        data-test-subj="queryEditorCollapseBtn"
        onClick={onClick}
        iconType={!isCollapsed ? 'arrowRight' : 'arrowDown'}
        iconSize={'s'}
      />
    </EuiToolTip>
  );
}
