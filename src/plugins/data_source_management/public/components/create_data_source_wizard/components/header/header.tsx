/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiSpacer, EuiText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';

export const Header = () => {
  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(
    i18n.translate('dataSourcesManagement.createDataSourceHeader', {
      defaultMessage: 'Create data source connection',
    })
  );

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <div>
          <EuiText size="s">
            <h1 data-test-subj="createDataSourceHeader">
              {
                <FormattedMessage
                  id="dataSourcesManagement.createDataSourceHeader"
                  defaultMessage="Create data source connection"
                />
              }
            </h1>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiText size="s">
            <p>
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.description"
                defaultMessage="Create a new data source connection to help you retrieve data from an external OpenSearch compatible source."
              />
              <br />
            </p>
          </EuiText>
          <EuiSpacer size="s" />
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
