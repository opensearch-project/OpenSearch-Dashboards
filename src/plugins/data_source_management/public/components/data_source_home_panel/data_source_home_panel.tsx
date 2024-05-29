/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { EuiPageTemplate, EuiSpacer, EuiTabs, EuiTab } from '@elastic/eui';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';

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

  const renderOpenSearchDSManageTab = () => {
    return <DataSourceTableWithRouter {...props} />;
  };

  const renderFlintDSManageTab = () => {
    return (
      <div>
        <h2>Manage direct query data sources</h2>
        <p>This is the content for managing direct query data sources.</p>
      </div>
    );
  };

  return (
    <EuiPageTemplate>
      <DataSourceHeader history={props.history} />
      <EuiSpacer size="l" />
      <EuiTabs>{renderTabs()}</EuiTabs>
      <EuiSpacer size="l" />
      {selectedTabId === 'manageOpensearchDataSources' && renderOpenSearchDSManageTab()}
      {selectedTabId === 'manageFlintDataSources' && renderFlintDSManageTab()}
    </EuiPageTemplate>
  );
};
