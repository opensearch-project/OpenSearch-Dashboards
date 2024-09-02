/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiOverlayMask,
  EuiPageBody,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiCompressedFieldSearch,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ApplicationStart,
  HttpStart,
  IUiSettingsClient,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import { useHistory } from 'react-router-dom';
import {
  DirectQueryDatasourceDetails,
  DirectQueryDatasourceStatus,
  DirectQueryDatasourceType,
} from '../../../types';
import { DeleteModal } from './direct_query_data_source_delete_modal';
import PrometheusLogo from '../icons/prometheus_logo.svg';
import S3Logo from '../icons/s3_logo.svg';
import { DataSourceSelector } from '../../data_source_selector';
import { DataSourceOption } from '../../data_source_menu/types';
import { DATACONNECTIONS_BASE, observabilityMetricsID } from '../../../constants';
import { getRenderCreateAccelerationFlyout } from '../../../plugin';
import { InstallIntegrationFlyout } from '../integrations/installed_integrations_table';
import { redirectToExplorerS3 } from '../associated_object_management/utils/associated_objects_tab_utils';
import { isPluginInstalled, getHideLocalCluster } from '../../utils';

interface DataConnection {
  connectionType: DirectQueryDatasourceType;
  name: string;
  dsStatus: DirectQueryDatasourceStatus;
}

interface ManageDirectQueryDataConnectionsTableProps {
  http: HttpStart;
  notifications: NotificationsStart;
  savedObjects: SavedObjectsStart;
  uiSettings: IUiSettingsClient;
  featureFlagStatus: boolean;
  application: ApplicationStart;
}

// Custom truncate function
const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const ManageDirectQueryDataConnectionsTable: React.FC<ManageDirectQueryDataConnectionsTableProps> = ({
  http,
  notifications,
  savedObjects,
  uiSettings,
  featureFlagStatus,
  application,
}) => {
  const [observabilityDashboardsExists, setObservabilityDashboardsExists] = useState(false);
  const [showIntegrationsFlyout, setShowIntegrationsFlyout] = useState(false);
  const [integrationsFlyout, setIntegrationsFlyout] = useState<React.JSX.Element | null>(null);

  const [data, setData] = useState<DataConnection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask />);
  const [selectedConnection, setSelectedConnection] = useState<string | undefined>(undefined);
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();

  const fetchDataSources = useCallback(() => {
    if (featureFlagStatus && selectedDataSourceId === undefined) return;

    const endpoint =
      featureFlagStatus && selectedDataSourceId !== undefined
        ? `${DATACONNECTIONS_BASE}/dataSourceMDSId=${selectedDataSourceId}`
        : `${DATACONNECTIONS_BASE}`;

    setIsLoading(true);

    http
      .get(endpoint)
      .then((res: DirectQueryDatasourceDetails[]) => {
        const dataConnections = res.map((dataConnection: DirectQueryDatasourceDetails) => ({
          name: dataConnection.name,
          connectionType: dataConnection.connector,
          dsStatus: dataConnection.status,
        }));
        setData(dataConnections);
      })
      .catch((err) => {
        notifications.toasts.addDanger('Could not fetch data sources');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [http, notifications.toasts, selectedDataSourceId, featureFlagStatus]);

  const deleteDataSources = useCallback(
    (connectionName: string | undefined) => {
      if (!connectionName || (featureFlagStatus && selectedDataSourceId === undefined)) return;

      const endpoint =
        featureFlagStatus && selectedDataSourceId !== undefined
          ? `${DATACONNECTIONS_BASE}/${connectionName}/dataSourceMDSId=${selectedDataSourceId}`
          : `${DATACONNECTIONS_BASE}/${connectionName}`;

      setIsLoading(true);

      http
        .delete(endpoint)
        .then(() => {
          notifications.toasts.addSuccess(`Data connection ${connectionName} deleted successfully`);
          setData(data.filter((connection) => connection.name !== connectionName));
        })
        .catch((err) => {
          notifications.toasts.addDanger(
            `Data connection ${connectionName} not deleted. See output for more details.`
          );
        })
        .finally(() => {
          setIsLoading(false);
          setSelectedConnection(undefined); // Clear the selected connection after deletion
        });
    },
    [http, notifications.toasts, selectedDataSourceId, featureFlagStatus, data]
  );

  useEffect(() => {
    fetchDataSources();
    isPluginInstalled('plugin:observabilityDashboards', notifications, http).then(
      setObservabilityDashboardsExists
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataSources]);

  const handleSelectedDataSourceChange = (e: DataSourceOption[]) => {
    const dataSourceId = e[0] ? e[0].id : undefined;
    setSelectedDataSourceId(dataSourceId);
  };

  const displayDeleteModal = (connectionName: string) => {
    setSelectedConnection(connectionName);
    setModalLayout(
      <DeleteModal
        onConfirm={() => {
          setIsModalVisible(false);
          deleteDataSources(connectionName);
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedConnection(undefined); // Clear the selected connection if cancel is clicked
        }}
        title={`Delete ${connectionName}`}
        message={`Are you sure you want to delete ${connectionName}?`}
      />
    );
    setIsModalVisible(true);
  };

  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  const actions = [
    {
      name: (datasource: DataConnection) =>
        `Query in ${
          datasource.connectionType === 'PROMETHEUS' ? 'Metrics Analytics' : 'Observability Logs'
        }`,
      isPrimary: true,
      icon: 'discoverApp',
      type: 'icon',
      available: (datasource: DataConnection) => observabilityDashboardsExists,
      onClick: (datasource: DataConnection) => {
        if (datasource.connectionType === 'PROMETHEUS') {
          application!.navigateToApp(observabilityMetricsID);
        } else if (datasource.connectionType === 'S3GLUE') {
          redirectToExplorerS3(datasource.name, application);
        }
      },
      'data-test-subj': 'action-query',
    },
    {
      name: 'Accelerate performance',
      isPrimary: false,
      icon: 'bolt',
      type: 'icon',
      available: (datasource: DataConnection) => datasource.connectionType !== 'PROMETHEUS',
      onClick: (datasource: DataConnection) => {
        renderCreateAccelerationFlyout({
          dataSourceName: datasource.name,
          dataSourceMDSId: selectedDataSourceId ?? '',
        });
      },
      'data-test-subj': 'action-accelerate',
    },
    {
      name: 'Integrate data',
      isPrimary: false,
      icon: 'integrationGeneral',
      type: 'icon',
      available: (datasource: DataConnection) =>
        !featureFlagStatus &&
        observabilityDashboardsExists &&
        datasource.connectionType !== 'PROMETHEUS',
      onClick: (datasource: DataConnection) => {
        setIntegrationsFlyout(
          <InstallIntegrationFlyout
            closeFlyout={() => setShowIntegrationsFlyout(false)}
            datasourceType={datasource.connectionType}
            datasourceName={datasource.name}
            http={http}
          />
        );
        setShowIntegrationsFlyout(true);
      },
      'data-test-subj': 'action-integrate',
    },
    {
      name: 'Delete',
      description: 'Delete this data source',
      icon: 'trash',
      color: 'danger',
      type: 'icon',
      onClick: (datasource: DataConnection) => displayDeleteModal(datasource.name),
      isPrimary: false,
      'data-test-subj': 'action-delete',
    },
  ];

  const icon = (record: DataConnection) => {
    switch (record.connectionType) {
      case 'S3GLUE':
        return <EuiIcon type={S3Logo} />;
      case 'PROMETHEUS':
        return <EuiIcon type={PrometheusLogo} />;
      default:
        return <></>;
    }
  };

  const tableColumns = [
    {
      field: 'name',
      name: 'Name',
      sortable: true,
      truncateText: true,
      render: (value, record: DataConnection) => (
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>{icon(record)}</EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiLink
              data-test-subj={`${record.name}DataConnectionsLink`}
              onClick={() =>
                history.push(`/manage/${record.name}?dataSourceMDSId=${selectedDataSourceId ?? ''}`)
              }
            >
              {truncate(record.name, 100)}
            </EuiLink>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    },
    {
      field: 'status',
      name: 'Status',
      sortable: true,
      truncateText: true,
      render: (value, record: DataConnection) =>
        record.dsStatus === 'ACTIVE' ? (
          <EuiHealth color="success">Active</EuiHealth>
        ) : (
          <EuiHealth color="subdued">Inactive</EuiHealth>
        ),
    },
    {
      field: 'actions',
      name: 'Actions',
      actions,
    },
  ] as Array<EuiTableFieldDataColumnType<unknown>>;

  const customSearchBar = (
    <EuiFlexGroup gutterSize="s" justifyContent="flexEnd">
      {featureFlagStatus && (
        <EuiFlexItem grow={false} style={{ width: '30%' }}>
          <DataSourceSelector
            savedObjectsClient={savedObjects.client}
            notifications={notifications.toasts}
            onSelectedDataSource={handleSelectedDataSourceChange}
            fullWidth={true}
            uiSettings={uiSettings}
            disabled={false}
            compressed={true}
            hideLocalCluster={getHideLocalCluster().enabled}
            isClearable={false}
          />
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={true}>
        <EuiCompressedFieldSearch
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          isClearable
          fullWidth={true}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const entries = data.filter((dataconnection) =>
    dataconnection.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <EuiPageBody component="div">
      <EuiFlexGroup justifyContent="center">
        <EuiFlexItem grow={false} style={{ width: '100%' }}>
          {customSearchBar}
          <EuiSpacer size="s" />
          {isLoading ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <EuiLoadingSpinner size="xl" />
              <EuiSpacer size="m" />
              <EuiText>Loading direct query data connections...</EuiText>
            </div>
          ) : (
            <EuiInMemoryTable
              items={entries}
              itemId="id"
              columns={tableColumns}
              tableLayout="auto"
              pagination={{
                initialPageSize: 10,
                pageSizeOptions: [5, 10, 15],
              }}
              allowNeutralSort={false}
              isSelectable={true}
            />
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      {isModalVisible && modalLayout}
      {showIntegrationsFlyout && integrationsFlyout}
    </EuiPageBody>
  );
};
