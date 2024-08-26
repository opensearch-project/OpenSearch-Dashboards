/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';

export const CreateDataSourcePanelHeader: React.FC = () => {
  return (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiText size="s">
          <h1>
            <FormattedMessage
              id="dataSourcesManagement.createDataSourcePanel.title"
              defaultMessage="Create Data Source"
            />
          </h1>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiText size="s">
          <p>
            <FormattedMessage
              id="dataSourcesManagement.createDataSourcePanel.description"
              defaultMessage="Select a data source type to get started."
            />
          </p>
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
