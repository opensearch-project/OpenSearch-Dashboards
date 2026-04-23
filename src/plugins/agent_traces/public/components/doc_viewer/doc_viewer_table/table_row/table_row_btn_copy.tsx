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
          id="agentTraces.docViews.table.copyValueButtonTooltip"
          defaultMessage="Copy value"
        />
      }
    >
      <EuiButtonIcon
        aria-label={i18n.translate('agentTraces.docViews.table.copyValueButtonAriaLabel', {
          defaultMessage: 'Copy value',
        })}
        className="agentTracesDocViewer__actionButton"
        data-test-subj="copyValueButton"
        onClick={onClick}
        iconType={'copy'}
        iconSize={'s'}
        size={'xs'}
      />
    </EuiToolTip>
  );
}
