/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FormattedMessage } from '@osd/i18n/react';
import { EuiCopy, EuiButtonIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface Props {
  textToCopy: string;
}

export function DocViewTableRowBtnCopy({ textToCopy }: Props) {
  return (
    <EuiCopy
      textToCopy={textToCopy}
      beforeMessage={
        <FormattedMessage
          id="explore.docViews.table.copyValueButtonTooltip"
          defaultMessage="Copy value"
        />
      }
    >
      {(copy) => (
        <EuiButtonIcon
          aria-label={i18n.translate('explore.docViews.table.copyValueButtonAriaLabel', {
            defaultMessage: 'Copy value',
          })}
          className="exploreDocViewer__actionButton"
          data-test-subj="copyValueButton"
          onClick={copy}
          iconType={'copy'}
          iconSize={'s'}
          size={'xs'}
        />
      )}
    </EuiCopy>
  );
}
