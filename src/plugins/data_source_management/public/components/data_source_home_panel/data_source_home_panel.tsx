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
} from '@elastic/eui';
import { TopNavControlButtonData, TopNavControlComponentData } from 'src/plugins/navigation/public';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { DataSourceHeader } from './data_source_page_header';
import { DataSourceTableWithRouter } from '../data_source_table/data_source_table';
import { ManageDirectQueryDataConnectionsTableWithRouter } from '../direct_query_data_sources_components/direct_query_data_connection/manage_direct_query_data_connections_table';
import { CreateButton } from '../create_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';
import { TopNavControlDescriptionData } from '../../../../navigation/public';

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
    workspaces,
    docLinks,
    navigation,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const defaultTabId = featureFlagStatus
    ? 'manageOpensearchDataSources'
    : 'manageDirectQueryDataSources';
  const [selectedTabId, setSelectedTabId] = useState(defaultTabId);
  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  const { HeaderControl } = navigation.ui;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

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
            controls={[
              currentWorkspace?.name
                ? {
                    description: i18n.translate(
                      'dataSourcesManagement.dataSourcesTable.workspace.description',
                      {
                        defaultMessage: 'View associated data sources for {name}.',
                        values: {
                          name: currentWorkspace.name,
                        },
                      }
                    ),
                  }
                : ({
                    description: i18n.translate(
                      'dataSourcesManagement.dataSourcesTable.description',
                      {
                        defaultMessage: 'Create and manage data source connections.',
                      }
                    ),
                    links: [
                      {
                        href: docLinks.links.opensearchDashboards.dataSource.guide,
                        controlType: 'link',
                        target: '_blank',
                        className: 'external-link-inline-block',
                        label: i18n.translate(
                          'dataSourcesManagement.dataSourcesTable.documentation',
                          {
                            defaultMessage: 'Learn more',
                          }
                        ),
                      },
                    ],
                  } as TopNavControlDescriptionData),
            ]}
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
          {selectedTabId === 'manageDirectQueryDataSources' && featureFlagStatus && (
            <ManageDirectQueryDataConnectionsTableWithRouter {...props} />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
