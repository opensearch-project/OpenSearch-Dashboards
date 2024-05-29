/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { RouteComponentProps } from 'react-router-dom';
import { CreateButton } from '../create_button';

type DataSourceHeaderProps = RouteComponentProps;

export const DataSourceHeader: React.FC<DataSourceHeaderProps> = ({ history }) => {
  const createButton = <CreateButton history={history} dataTestSubj="createDataSourceButton" />;

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <EuiTitle>
          <h2>
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.title"
              defaultMessage="Data Sources"
            />
          </h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText>
          <p>
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.description"
              defaultMessage="Create and manage data source connections to help you retrieve data from multiple OpenSearch compatible sources."
            />
          </p>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{createButton}</EuiFlexItem>
    </EuiFlexGroup>
  );
};
