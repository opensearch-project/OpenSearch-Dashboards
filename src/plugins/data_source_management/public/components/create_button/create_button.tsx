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
}

export const CreateButton = ({ history }: Props) => {
  return (
    <EuiButton
      data-test-subj="createDataSourceButton"
      fill={true}
      onClick={() => history.push('/create')}
      iconType="plusInCircle"
    >
      <FormattedMessage
        id="dataSourcesManagement.dataSourcesTable.createBtn"
        defaultMessage="Create data source connection"
      />
    </EuiButton>
  );
};
