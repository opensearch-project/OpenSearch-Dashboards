/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { RouteComponentProps } from 'react-router-dom';

type DataSourceHeaderProps = RouteComponentProps;

export const DataSourceHeader: React.FC<DataSourceHeaderProps> = () => {
  return (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiText size="s">
          <h1>
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.title"
              defaultMessage="Data Sources"
            />
          </h1>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText size="s">
          <p>
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.description"
              defaultMessage="Create and manage data source connections."
            />
          </p>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
