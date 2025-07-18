/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiIcon, EuiPopover, EuiPopoverTitle, EuiText } from '@elastic/eui';
import { selectQueryStatus } from '../../../../application/utils/state_management/selectors';
import { ResultStatus } from '../../../../../../data/public';
import './query_panel_error.scss';

const label = i18n.translate('explore.queryPanel.queryPanelErrorLabel', {
  defaultMessage: 'Error',
});

export const QueryPanelError = () => {
  const queryStatus = useSelector(selectQueryStatus);
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const { error } = queryStatus;

  if (queryStatus.status !== ResultStatus.ERROR || !error) {
    return null;
  }

  return (
    <EuiPopover
      id="queryPanelErrorPopover"
      button={
        <EuiButtonEmpty
          color="danger"
          size="xs"
          className="exploreQueryPanelError"
          data-test-subj="exploreQueryPanelError"
          onClick={() => setPopoverIsOpen((value) => !value)}
        >
          <div className="exploreQueryPanelError__buttonTextWrapper">
            <EuiIcon type="alert" size="s" />
            <EuiText size="xs">{label}</EuiText>
          </div>
        </EuiButtonEmpty>
      }
      isOpen={popoverIsOpen}
      closePopover={() => setPopoverIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downCenter"
    >
      <EuiPopoverTitle>
        <FormattedMessage id="explore.queryPanel.queryPanelError.title" defaultMessage="Errors" />
      </EuiPopoverTitle>
      <div className="exploreQueryPanelError__popoverBody">{error.message.reason}</div>
    </EuiPopover>
  );
};
