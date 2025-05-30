/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface Props {
  onClick: () => void;
  disabled: boolean;
}

export function DocViewTableRowBtnFilterAdd({ onClick, disabled = false }: Props) {
  const tooltipContent = disabled ? (
    <FormattedMessage
      id="explore.docViews.table.unindexedFieldsCanNotBeSearchedTooltip"
      defaultMessage="Unindexed fields can not be searched"
    />
  ) : (
    <FormattedMessage
      id="explore.docViews.table.filterForValueButtonTooltip"
      defaultMessage="Filter for value"
    />
  );

  return (
    <EuiToolTip content={tooltipContent}>
      <EuiButtonIcon
        aria-label={i18n.translate('explore.docViews.table.filterForValueButtonAriaLabel', {
          defaultMessage: 'Filter for value',
        })}
        className="exploreDocViewer__actionButton"
        data-test-subj="addInclusiveFilterButton"
        disabled={disabled}
        onClick={onClick}
        iconType={'magnifyWithPlus'}
        iconSize={'s'}
        size={'xs'}
      />
    </EuiToolTip>
  );
}
