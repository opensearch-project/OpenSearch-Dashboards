/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { EuiFlexGroup, EuiFlexItem, EuiPageHeader, EuiPanel } from '@elastic/eui';
import { TopNavControlButtonData } from 'src/plugins/navigation/public';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { DataSourceHeader } from '../data_source_home_panel/data_source_page_header';
import { DataConnectionsTableWithRouter } from '../data_connections_table/data_connections_table';
import { CreateButton } from '../create_button';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getListBreadcrumbs } from '../breadcrumbs';
import { DataSourceManagementContext } from '../../types';
import { TopNavControlDescriptionData } from '../../../../navigation/public';
import { useDataConnectionTypeCards } from '../create_data_connection_panel/data_connection_type_cards';

interface DataConnectionsHomePanelProps extends RouteComponentProps {
  featureFlagStatus: boolean;
  useNewUX: boolean;
}

export const DataConnectionsHomePanel: React.FC<DataConnectionsHomePanelProps> = ({
  featureFlagStatus,
  useNewUX,
  ...props
}) => {
  const { setBreadcrumbs, application, workspaces, docLinks, navigation } =
    useOpenSearchDashboards<DataSourceManagementContext>().services;

  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  // The Create page is for anyone with a type to connect: data source managers, or a user with a
  // flow card (a flow may not require data source management).
  const { cards } = useDataConnectionTypeCards();
  const canCreate = canManageDataSource || cards.length > 0;
  const { HeaderControl } = navigation.ui;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));

  useEffect(() => {
    setBreadcrumbs(getListBreadcrumbs());
  }, [setBreadcrumbs]);

  // No connection flow buttons here: the Create page offers the types as cards. The button is named
  // for that page, Create data connection, and keeps the plus icon of the Data sources pages.
  const createDataSourceButton = [
    {
      id: 'Create data source',
      label: i18n.translate('dataSourcesManagement.dataConnections.createButton', {
        defaultMessage: 'Create data connection',
      }),
      testId: 'createDataSourceButton',
      run: () => props.history.push('/create'),
      fill: true,
      iconType: 'plus',
      controlType: 'button',
    } as TopNavControlButtonData,
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

  return (
    <>
      {useNewUX && (
        <>
          {canCreate && (
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
                : description,
            ]}
          />
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
                    {canCreate ? (
                      <EuiFlexItem grow={false}>
                        <CreateButton
                          history={props.history}
                          featureFlagStatus={featureFlagStatus}
                          dataTestSubj="createDataSourceButton"
                        />
                      </EuiFlexItem>
                    ) : null}
                  </EuiFlexGroup>
                </EuiPageHeader>
              </EuiFlexItem>
            </>
          )}
          <EuiFlexItem>
            <DataConnectionsTableWithRouter featureFlagStatus={featureFlagStatus} {...props} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
};
