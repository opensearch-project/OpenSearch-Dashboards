/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { EuiSpacer, EuiTitle, EuiText, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataSourceManagementContext } from '../../../../types';
import { CREATE_DATA_SOURCE_HEADER } from '../../../text_content';

export const Header = () => {
  const changeTitle = useOpenSearchDashboards<DataSourceManagementContext>().services.chrome
    .docTitle.change;

  changeTitle(CREATE_DATA_SOURCE_HEADER);

  return (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <div>
          <EuiTitle>
            <h1 data-test-subj="createDataSourceHeader">{CREATE_DATA_SOURCE_HEADER}</h1>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText>
            <p>
              <FormattedMessage
                id="dataSourcesManagement.createDataSource.description"
                defaultMessage="Create a new data source connection to help you retrieve data from an external OpenSearch compatible source."
              />
              <br />
            </p>
          </EuiText>
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
