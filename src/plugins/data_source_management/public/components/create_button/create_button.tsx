/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History } from 'history';

import { EuiSmallButton } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface Props {
  history: History;
  isEmptyState?: boolean;
  dataTestSubj: string;
  featureFlagStatus: boolean;
}

export const CreateButton = ({ history, isEmptyState, dataTestSubj, featureFlagStatus }: Props) => {
  return (
    <EuiSmallButton
      data-test-subj={dataTestSubj}
      fill={isEmptyState ? false : true}
      onClick={() => history.push('/create')}
    >
      {featureFlagStatus ? (
        <FormattedMessage
          id="dataSourcesManagement.dataSourceListing.createDataSourceButton"
          defaultMessage="Create data source connection"
        />
      ) : (
        <FormattedMessage
          id="dataSourcesManagement.dataSourceListing.createDirectQueryButton"
          defaultMessage="Create direct query connection"
        />
      )}
    </EuiSmallButton>
  );
};
