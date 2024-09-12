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
      <FormattedMessage
        id="dataSourcesManagement.dataSourceListing.createButton"
        defaultMessage={
          featureFlagStatus ? 'Create data source connection' : 'Create direct query connection'
        }
      />
    </EuiSmallButton>
  );
};
