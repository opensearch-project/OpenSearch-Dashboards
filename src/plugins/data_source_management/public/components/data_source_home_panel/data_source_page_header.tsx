/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { RouteComponentProps } from 'react-router-dom';

interface DataSourceHeaderProps extends RouteComponentProps {
  featureFlagStatus: boolean;
}

export const DataSourceHeader: React.FC<DataSourceHeaderProps> = ({ featureFlagStatus }) => {
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
            {featureFlagStatus ? (
              <FormattedMessage
                id="dataSourcesManagement.dataSourcesTable.mdsEnabled.description"
                defaultMessage="Create and manage data source connections."
              />
            ) : (
              <FormattedMessage
                id="dataSourcesManagement.dataSourcesTable.mdsDisabled.description"
                defaultMessage="Manage direct query data source connections."
              />
            )}
          </p>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
