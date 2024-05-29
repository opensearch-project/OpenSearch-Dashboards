/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { EuiPageTemplate, EuiSpacer, EuiTabs, EuiTab } from '@elastic/eui';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';
import { ManageFlintDataConnection } from '../flint_data_sources_components/flint_data_connection/manage_flint_data_connection';

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
    <EuiPageTemplate>
      <DataSourceHeader history={props.history} />
      <EuiSpacer size="l" />
      <EuiTabs>{renderTabs()}</EuiTabs>
      <EuiSpacer size="l" />
      {selectedTabId === 'manageOpensearchDataSources' && <DataSourceTableWithRouter {...props} />}
      {selectedTabId === 'manageFlintDataSources' && <ManageFlintDataConnection />}
    </EuiPageTemplate>
  );
};
