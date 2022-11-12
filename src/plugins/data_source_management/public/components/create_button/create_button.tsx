/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History } from 'history';

import { EuiButton } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface Props {
  history: History;
  isEmptyState?: boolean;
  dataTestSubj: string;
}

export const CreateButton = ({ history, isEmptyState, dataTestSubj }: Props) => {
  return (
    <EuiButton
      data-test-subj={dataTestSubj}
      fill={isEmptyState ? false : true}
      onClick={() => history.push('/create')}
    >
      <FormattedMessage
        id="dataSourcesManagement.dataSourceListing.createButton"
        defaultMessage="Create data source connection"
      />
    </EuiButton>
  );
};
