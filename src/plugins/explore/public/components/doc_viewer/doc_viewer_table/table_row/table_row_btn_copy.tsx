/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormattedMessage } from '@osd/i18n/react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface Props {
  onClick: () => void;
}

export function DocViewTableRowBtnCopy({ onClick }: Props) {
  return (
    <EuiToolTip
      content={
        <FormattedMessage
          id="explore.docViews.table.copyValueButtonTooltip"
          defaultMessage="Copy value"
        />
      }
    >
      <EuiButtonIcon
        aria-label={i18n.translate('explore.docViews.table.copyValueButtonAriaLabel', {
          defaultMessage: 'Copy value',
        })}
        className="exploreDocViewer__actionButton"
        data-test-subj="copyValueButton"
        onClick={onClick}
        iconType={'copy'}
        iconSize={'s'}
        size={'xs'}
      />
    </EuiToolTip>
  );
}
