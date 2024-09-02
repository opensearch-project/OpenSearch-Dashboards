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
  EuiButtonGroup,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { TopNavControlButtonData, TopNavControlComponentData } from 'src/plugins/navigation/public';
import { FormattedMessage } from '@osd/i18n/react';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';
import { ManageDirectQueryDataConnectionsTable } from '../direct_query_data_sources_components/direct_query_data_connection/manage_direct_query_data_connections_table';
import { CreateButton } from '../create_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';

interface DataSourceHomePanelProps extends RouteComponentProps {
  featureFlagStatus: boolean;
  useNewUX: boolean;
}

export const DataSourceHomePanel: React.FC<DataSourceHomePanelProps> = ({
  featureFlagStatus,
  useNewUX,
  ...props
}) => {
  const {
    setBreadcrumbs,
    notifications,
    http,
    savedObjects,
    uiSettings,
    application,
    docLinks,
    navigation,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const defaultTabId = featureFlagStatus
    ? 'manageOpensearchDataSources'
    : 'manageDirectQueryDataSources';
  const [selectedTabId, setSelectedTabId] = useState(defaultTabId);
  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  const { HeaderControl } = navigation.ui;

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const description = [
    {
      renderComponent: (
        <EuiText size="s" color="subdued">
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.description"
            defaultMessage="Create and manage data source connections. "
          />
          <EuiLink
            external={true}
            href={docLinks.links.opensearchDashboards.dataSource.guide}
            target="_blank"
            className="external-link-inline-block"
          >
            Learn more
          </EuiLink>
        </EuiText>
      ),
    },
  ];

  const createDataSourceButton = [
    {
      id: 'Create data source',
      label: 'Create data source connection',
      testId: 'createDataSourceButton',
      run: () => props.history.push('/create'),
      fill: true,
      iconType: 'plus',
      controlType: 'button',
    } as TopNavControlButtonData,
  ];

  const connectionTypeButton = [
    {
      renderComponent: (
        <EuiButtonGroup
          legend="connection type"
          buttonSize="compressed"
          options={[
            { id: 'manageOpensearchDataSources', label: 'OpenSearch connections' },
            { id: 'manageDirectQueryDataSources', label: 'Direct query connections' },
          ]}
          idSelected={selectedTabId}
          onChange={(id) => onSelectedTabChanged(id)}
        />
      ),
    } as TopNavControlComponentData,
  ];

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
      {useNewUX && (
        <>
          <HeaderControl
            setMountPoint={application.setAppCenterControls}
            controls={connectionTypeButton}
          />
          {canManageDataSource && (
            <HeaderControl
              setMountPoint={application.setAppRightControls}
              controls={createDataSourceButton}
            />
          )}
          <HeaderControl
            setMountPoint={application.setAppDescriptionControls}
            controls={description}
          />
        </>
      )}
      <EuiFlexGroup direction="column">
        {!useNewUX && (
          <>
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
              <EuiTabs size="s">{renderTabs()}</EuiTabs>
            </EuiFlexItem>
          </>
        )}
        <EuiFlexItem>
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
