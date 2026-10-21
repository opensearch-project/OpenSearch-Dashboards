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
  EuiSmallButton,
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
import { DirectQueryConnectionFlow } from '../../direct_query_connection_flow_registry';
import {
  DIRECT_QUERY_CONNECTIONS_TAB_ID,
  getDirectQueryConnectionFlowPath,
} from '../direct_query_connection_flow/constants';

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
    application,
    workspaces,
    docLinks,
    navigation,
    directQueryConnectionFlowRegistry,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;

  const defaultTabId = featureFlagStatus
    ? 'manageOpensearchDataSources'
    : 'manageDirectQueryDataSources';
  // Direct query connection flows navigate back to the list with the Direct query connections
  // tab pre-selected via location state.
  const locationState = (props.location ?? props.history?.location)?.state as
    { selectedTabId?: string } | undefined;
  const initialTabId =
    directQueryConnectionFlowRegistry?.hasFlows() &&
    locationState?.selectedTabId === DIRECT_QUERY_CONNECTIONS_TAB_ID
      ? DIRECT_QUERY_CONNECTIONS_TAB_ID
      : defaultTabId;
  const [selectedTabId, setSelectedTabId] = useState(initialTabId);
  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  const { HeaderControl } = navigation.ui;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const [visibleFlows, setVisibleFlows] = useState<DirectQueryConnectionFlow[]>([]);

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (!canManageDataSource || !directQueryConnectionFlowRegistry?.hasFlows()) {
      return;
    }
    let cancelled = false;
    directQueryConnectionFlowRegistry.getVisibleFlows().then((flows) => {
      if (!cancelled) {
        setVisibleFlows(flows);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [canManageDataSource, directQueryConnectionFlowRegistry]);

  const isDirectQueryTabSelected =
    !featureFlagStatus || selectedTabId === DIRECT_QUERY_CONNECTIONS_TAB_ID;
  const shownFlows = canManageDataSource && isDirectQueryTabSelected ? visibleFlows : [];

  const onSelectedTabChanged = (id: string) => {
    setSelectedTabId(id);
  };

  const createDataSourceButton = [
    {
      id: 'Create data source',
      label: featureFlagStatus ? 'Create data source connection' : 'Create direct query connection',
      testId: 'createDataSourceButton',
      run: () => props.history.push('/create'),
      fill: true,
      iconType: 'plus',
      controlType: 'button',
    } as TopNavControlButtonData,
  ];

  const directQueryConnectionFlowButtons = shownFlows.map(
    (flow) =>
      ({
        id: `directQueryConnectionFlow-${flow.id}`,
        label: flow.buttonLabel,
        testId: `directQueryConnectionFlowButton-${flow.id}`,
        run: () => props.history.push(getDirectQueryConnectionFlowPath(flow.id)),
        iconType: 'plus',
        controlType: 'button',
      }) as TopNavControlButtonData
  );

  // @ts-expect-error TS6133 TODO(ts-error): fixme
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

  const description = {
    description: featureFlagStatus
      ? i18n.translate('dataSourcesManagement.dataSourcesTable.descriptionWithDataSource', {
          defaultMessage: 'Create and manage data source connections.',
        })
      : i18n.translate('dataSourcesManagement.dataSourcesTable.description', {
          defaultMessage: 'Manage direct query data source connections.',
        }),
    links: [
      {
        href: docLinks.links.opensearchDashboards.dataSource.guide,
        controlType: 'link',
        target: '_blank',
        className: 'external-link-inline-block',
        label: i18n.translate('dataSourcesManagement.dataSourcesTable.documentation', {
          defaultMessage: 'Learn more',
        }),
      },
    ],
  } as TopNavControlDescriptionData;

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
    <>
      {useNewUX && (
        <>
          {canManageDataSource && (
            <HeaderControl
              setMountPoint={application.setAppRightControls}
              controls={
                directQueryConnectionFlowButtons.length > 0
                  ? [...directQueryConnectionFlowButtons, ...createDataSourceButton]
                  : createDataSourceButton
              }
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
                : description,
            ]}
          />
          <EuiTabs size="s">{renderTabs()}</EuiTabs>
          <EuiSpacer size="m" />
        </>
      )}
      <EuiPanel>
        <EuiFlexGroup direction="column">
          {!useNewUX && (
            <>
              <EuiFlexItem>
                <EuiPageHeader>
                  <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                    <EuiFlexItem grow={false}>
                      {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
                      <DataSourceHeader
                        history={props.history}
                        featureFlagStatus={featureFlagStatus}
                      />
                    </EuiFlexItem>
                    {canManageDataSource ? (
                      <EuiFlexItem grow={false}>
                        {shownFlows.length > 0 ? (
                          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                            {shownFlows.map((flow) => (
                              <EuiFlexItem grow={false} key={flow.id}>
                                <EuiSmallButton
                                  iconType="plus"
                                  data-test-subj={`directQueryConnectionFlowButton-${flow.id}`}
                                  onClick={() =>
                                    props.history.push(getDirectQueryConnectionFlowPath(flow.id))
                                  }
                                >
                                  {flow.buttonLabel}
                                </EuiSmallButton>
                              </EuiFlexItem>
                            ))}
                            <EuiFlexItem grow={false}>
                              <CreateButton
                                history={props.history}
                                featureFlagStatus={featureFlagStatus}
                                dataTestSubj="createDataSourceButton"
                              />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        ) : (
                          <CreateButton
                            history={props.history}
                            featureFlagStatus={featureFlagStatus}
                            dataTestSubj="createDataSourceButton"
                          />
                        )}
                      </EuiFlexItem>
                    ) : null}
                  </EuiFlexGroup>
                </EuiPageHeader>
              </EuiFlexItem>
              {featureFlagStatus && (
                <EuiFlexItem>
                  <EuiSpacer size="s" />
                  <EuiTabs size="s">{renderTabs()}</EuiTabs>
                </EuiFlexItem>
              )}
            </>
          )}
          <EuiFlexItem>
            {selectedTabId === 'manageOpensearchDataSources' && featureFlagStatus && (
              <DataSourceTableWithRouter {...props} />
            )}
            {isDirectQueryTabSelected && (
              <ManageDirectQueryDataConnectionsTableWithRouter
                featureFlagStatus={featureFlagStatus}
                {...props}
              />
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
};
