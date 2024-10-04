/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPageHeader, EuiPanel } from '@elastic/eui';
import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';
import { TopNavControlDescriptionData } from '../../../../navigation/public';

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
      description: i18n.translate('dataSourcesManagement.createDataSourcePanel.description', {
        defaultMessage: 'Select a data source type to get started.',
      }),
    } as TopNavControlDescriptionData,
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
