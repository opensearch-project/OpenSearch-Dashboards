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

const tabs = [
  {
    id: 'manageDirectQueryDataSources',
    name: 'Direct query connections',
  },
  {
    id: 'manageOpensearchDataSources',
    name: 'OpenSearch connections',
  },
];

export const DataSourceHomePanel: React.FC<RouteComponentProps> = (props) => {
  const { setBreadcrumbs, notifications, http } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;

  const [selectedTabId, setSelectedTabId] = useState('manageDirectQueryDataSources');

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

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
              <EuiFlexItem grow={false}>
                <CreateButton history={props.history} dataTestSubj="createDataSourceButton" />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPageHeader>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="s" />
          <EuiTabs>{renderTabs()}</EuiTabs>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiSpacer size="s" />
          {selectedTabId === 'manageOpensearchDataSources' && (
            <DataSourceTableWithRouter {...props} />
          )}
          {selectedTabId === 'manageDirectQueryDataSources' && (
            <ManageDirectQueryDataConnectionsTable http={http} notifications={notifications} />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
