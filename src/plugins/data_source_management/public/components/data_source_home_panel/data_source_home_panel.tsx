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
    id: 'manage',
    name: 'Manage data sources',
  },
  {
    id: 'new',
    name: 'New data source',
  },
];

export const DataSourceHomePanel: React.FC<RouteComponentProps> = (props) => {
  const [selectedTabId, setSelectedTabId] = useState('manage');

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

  const renderManageTab = () => {
    return <DataSourceTableWithRouter {...props} />;
  };

  const renderNewTab = () => {
    return (
      <div>
        <h2>New Data Source</h2>
        <p>This is the content for creating a new data source.</p>
      </div>
    );
  };

  return (
    <EuiPageTemplate>
      <DataSourceHeader history={props.history} />
      <EuiSpacer size="l" />
      <EuiTabs>{renderTabs()}</EuiTabs>
      <EuiSpacer size="l" />
      {selectedTabId === 'manage' && renderManageTab()}
      {selectedTabId === 'new' && renderNewTab()}
    </EuiPageTemplate>
  );
};
