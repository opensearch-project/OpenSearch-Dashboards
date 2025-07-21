/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { EuiIcon, EuiTitle } from '@elastic/eui';
import { selectOverallQueryStatus } from '../../application/utils/state_management/selectors';
import { ErrorCodeBlock } from './error_code_block';
import { CanvasPanel } from '../panel/canvas_panel';
import './error_panel.scss';

const errorDefaultTitle = i18n.translate('explore.errorPanel.defaultTitle', {
  defaultMessage: 'An error occurred while executing the query',
});
const detailsText = i18n.translate('explore.errorPanel.details', {
  defaultMessage: 'Details',
});
const typeText = i18n.translate('explore.errorPanel.type', {
  defaultMessage: 'Type',
});

export const ErrorPanel = () => {
  const queryStatus = useSelector(selectOverallQueryStatus);
  const error = queryStatus.error;

  if (!error) {
    return null;
  }

  return (
    <CanvasPanel className="exploreErrorPanel" testId="exploreErrorPanel">
      <EuiIcon type="alert" size="xl" color="red" />
      <EuiTitle size="l">
        <h1>{error.message.reason || errorDefaultTitle}</h1>
      </EuiTitle>
      <div className="exploreErrorPanel__errorsSection">
        <ErrorCodeBlock title={detailsText} text={error.message.details} />
        {error.message.type ? <ErrorCodeBlock title={typeText} text={error.message.type} /> : null}
      </div>
    </CanvasPanel>
  );
};
