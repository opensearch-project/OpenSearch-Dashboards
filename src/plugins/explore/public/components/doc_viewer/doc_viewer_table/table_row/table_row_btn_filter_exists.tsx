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
  disabled?: boolean;
  scripted?: boolean;
}

export function DocViewTableRowBtnFilterExists({
  onClick,
  disabled = false,
  scripted = false,
}: Props) {
  const tooltipContent = disabled ? (
    scripted ? (
      <FormattedMessage
        id="explore.docViews.table.unableToFilterForPresenceOfScriptedFieldsTooltip"
        defaultMessage="Unable to filter for presence of scripted fields"
      />
    ) : (
      <FormattedMessage
        id="explore.docViews.table.unableToFilterForPresenceOfMetaFieldsTooltip"
        defaultMessage="Unable to filter for presence of meta fields"
      />
    )
  ) : (
    <FormattedMessage
      id="explore.docViews.table.filterForFieldPresentButtonTooltip"
      defaultMessage="Filter for field present"
    />
  );

  return (
    <EuiToolTip content={tooltipContent}>
      <EuiButtonIcon
        aria-label={i18n.translate('explore.docViews.table.filterForFieldPresentButtonAriaLabel', {
          defaultMessage: 'Filter for field present',
        })}
        onClick={onClick}
        className="exploreDocViewer__actionButton"
        data-test-subj="addExistsFilterButton"
        disabled={disabled}
        iconType={'indexOpen'}
        iconSize={'s'}
        size={'xs'}
      />
    </EuiToolTip>
  );
}
