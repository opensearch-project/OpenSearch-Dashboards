/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface Props {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function DocViewTableRowBtnToggleColumn({ onClick, active, disabled = false }: Props) {
  if (disabled) {
    return (
      <EuiButtonIcon
        aria-label={i18n.translate('explore.docViews.table.toggleColumnInTableButtonAriaLabel', {
          defaultMessage: 'Toggle column in table',
        })}
        className="exploreDocViewer__actionButton"
        data-test-subj="toggleColumnButton"
        disabled
        iconType={'tableOfContents'}
        iconSize={'s'}
        size={'xs'}
      />
    );
  }
  return (
    <EuiToolTip
      content={
        <FormattedMessage
          id="explore.docViews.table.toggleColumnInTableButtonTooltip"
          defaultMessage="Toggle column in table"
        />
      }
    >
      <EuiButtonIcon
        aria-label={i18n.translate('explore.docViews.table.toggleColumnInTableButtonAriaLabel', {
          defaultMessage: 'Toggle column in table',
        })}
        aria-pressed={active}
        onClick={onClick}
        className="exploreDocViewer__actionButton"
        data-test-subj="toggleColumnButton"
        iconType={'tableOfContents'}
        iconSize={'s'}
        size={'xs'}
      />
    </EuiToolTip>
  );
}
