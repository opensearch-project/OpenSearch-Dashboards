/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTabs,
  EuiTab,
  EuiPageHeader,
  EuiPanel,
} from '@elastic/eui';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';
import { ManageDirectQueryDataConnectionsTable } from '../direct_query_data_sources_components/direct_query_data_connection/manage_direct_query_data_connections_table';
import { CreateButton } from '../create_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';

interface DataSourceHomePanelProps extends RouteComponentProps {
  featureFlagStatus: boolean;
}

export const DataSourceHomePanel: React.FC<DataSourceHomePanelProps> = ({
  featureFlagStatus,
  ...props
}) => {
  const {
    setBreadcrumbs,
    notifications,
    http,
    savedObjects,
    uiSettings,
    application,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const defaultTabId = featureFlagStatus
    ? 'manageOpensearchDataSources'
    : 'manageDirectQueryDataSources';
  const [selectedTabId, setSelectedTabId] = useState(defaultTabId);
  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const tabs = [
    ...(featureFlagStatus
      ? [
          {
            id: 'manageOpensearchDataSources',
            name: 'OpenSearch connections',
          },
        ]
      : []),
    {
      id: 'manageDirectQueryDataSources',
      name: 'Direct query connections',
    },
  ];

  const renderTabs = () => {
    return tabs.map((tab) => (
      <EuiTab
        onClick={() => onSelectedTabChanged(tab.id)}
        isSelected={tab.id === selectedTabId}
        key={tab.id}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  return (
    <EuiPanel>
      <EuiFlexGroup direction="column">
        <EuiFlexItem>
          <EuiPageHeader>
            <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
              <EuiFlexItem grow={false}>
                <DataSourceHeader history={props.history} />
              </EuiFlexItem>
              {canManageDataSource ? (
                <EuiFlexItem grow={false}>
                  <CreateButton history={props.history} dataTestSubj="createDataSourceButton" />
                </EuiFlexItem>
              ) : null}
            </EuiFlexGroup>
          </EuiPageHeader>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiTabs>{renderTabs()}</EuiTabs>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="s" />
          {selectedTabId === 'manageOpensearchDataSources' && featureFlagStatus && (
            <DataSourceTableWithRouter {...props} />
          )}
          {selectedTabId === 'manageDirectQueryDataSources' && (
            <ManageDirectQueryDataConnectionsTable
              http={http}
              notifications={notifications}
              savedObjects={savedObjects}
              uiSettings={uiSettings}
              featureFlagStatus={featureFlagStatus}
              application={application}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
