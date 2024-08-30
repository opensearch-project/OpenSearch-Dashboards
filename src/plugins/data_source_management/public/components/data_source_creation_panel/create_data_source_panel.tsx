/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPageHeader, EuiPanel, EuiText } from '@elastic/eui';
import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { FormattedMessage } from '@osd/i18n/react';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';

interface CreateDataSourcePanelProps extends RouteComponentProps {
  featureFlagStatus: boolean;
  useNewUX: boolean;
}

export const CreateDataSourcePanel: React.FC<CreateDataSourcePanelProps> = ({
  featureFlagStatus,
  useNewUX,
  ...props
}) => {
  const {
    chrome,
    application,
    setBreadcrumbs,
    notifications: { toasts },
    uiSettings,
    navigation,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  useEffect(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
  }, [setBreadcrumbs]);

  const { HeaderControl } = navigation.ui;
  const description = [
    {
      renderComponent: (
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="dataSourcesManagement.createDataSourcePanel.description"
            defaultMessage="Select a data source type to get started. "
          />
        </EuiText>
      ),
    },
  ];

  return useNewUX ? (
    <>
      <HeaderControl setMountPoint={application.setAppDescriptionControls} controls={description} />
      <EuiPanel color="transparent" hasBorder={false} paddingSize="none">
        <EuiFlexGroup direction="column">
          <EuiFlexItem>
            <CreateDataSourceCardView
              history={props.history}
              featureFlagStatus={featureFlagStatus}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  ) : (
    <EuiPanel>
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiPageHeader>
            <CreateDataSourcePanelHeader />
          </EuiPageHeader>
        </EuiFlexItem>
        <EuiFlexItem>
          <CreateDataSourceCardView history={props.history} featureFlagStatus={featureFlagStatus} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
