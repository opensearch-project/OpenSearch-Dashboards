/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiPageHeader, EuiPanel } from '@elastic/eui';
import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';

interface CreateDataSourcePanelProps extends RouteComponentProps {
  featureFlagStatus: boolean;
}

export const CreateDataSourcePanel: React.FC<CreateDataSourcePanelProps> = ({
  featureFlagStatus,
  ...props
}) => {
  const {
    chrome,
    setBreadcrumbs,
    notifications: { toasts },
    uiSettings,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  useEffect(() => {
    setBreadcrumbs(getCreateBreadcrumbs());
  }, [setBreadcrumbs]);

  return (
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
