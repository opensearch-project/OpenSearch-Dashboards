/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { ManageFlintDataConnectionsTable } from '../flint_data_sources_components/flint_data_connection/manage_flint_data_connections_table';
import { CreateButton } from '../create_button';

const tabs = [
  {
    id: 'manageFlintDataSources',
    name: 'Manage direct query data sources',
  },
  {
    id: 'manageOpensearchDataSources',
    name: 'Manage OpenSearch data sources',
  },
];

export const DataSourceHomePanel: React.FC<RouteComponentProps> = (props) => {
  const [selectedTabId, setSelectedTabId] = useState('manageFlintDataSources');

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
          {selectedTabId === 'manageFlintDataSources' && <ManageFlintDataConnectionsTable />}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
