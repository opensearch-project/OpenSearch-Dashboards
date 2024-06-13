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
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import {
  DirectQueryDatasourceDetails,
  DirectQueryDatasourceStatus,
  DirectQueryDatasourceType,
} from '../../../types';
import { DeleteModal } from './delete_modal';
import PrometheusLogo from '../icons/prometheus_logo.svg';
import S3Logo from '../icons/s3_logo.svg';

interface DataConnection {
  connectionType: DirectQueryDatasourceType;
  name: string;
  dsStatus: DirectQueryDatasourceStatus;
}

interface ManageDirectQueryDataConnectionsTableProps {
  http: HttpStart;
  notifications: NotificationsStart;
}

// Custom truncate function
const truncate = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const ManageDirectQueryDataConnectionsTable: React.FC<ManageDirectQueryDataConnectionsTableProps> = ({
  http,
  notifications,
}) => {
  const [data, setData] = useState<DataConnection[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask />);

  const fetchDataSources = useCallback(() => {
    http
      .get('/api/dataconnections')
      .then((res: DirectQueryDatasourceDetails[]) => {
        const dataConnections = res.map((dataConnection: DirectQueryDatasourceDetails) => {
          return {
            name: dataConnection.name,
            connectionType: dataConnection.connector,
            dsStatus: dataConnection.status,
          };
        });
        setData(dataConnections);
      })
      .catch((err) => {
        notifications.toasts.addDanger('Could not fetch data sources');
      });
  }, [http, notifications.toasts]);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const deleteConnection = (connectionName: string) => {
    setData(
      data.filter((connection) => {
        return !(connection.name === connectionName);
      })
    );
  };

  const displayDeleteModal = (connectionName: string) => {
    setModalLayout(
      <DeleteModal
        onConfirm={() => {
          setIsModalVisible(false);
          deleteConnection(connectionName);
        }}
        onCancel={() => {
          setIsModalVisible(false);
        }}
        title={`Delete ${connectionName}`}
        message={`Are you sure you want to delete ${connectionName}?`}
      />
    );
    setIsModalVisible(true);
  };

  const actions = [
    {
      name: (datasource: DataConnection) =>
        `Query in ${
          datasource.connectionType === 'PROMETHEUS' ? 'Metrics Analytics' : 'Observability Logs'
        }`,
      isPrimary: true,
      icon: 'discoverApp',
      type: 'icon',
      onClick: () => {},
      'data-test-subj': 'action-query',
    },
    {
      name: 'Accelerate performance',
      isPrimary: false,
      icon: 'bolt',
      type: 'icon',
      available: (datasource: DataConnection) => datasource.connectionType !== 'PROMETHEUS',
      onClick: () => {},
      'data-test-subj': 'action-accelerate',
    },
    {
      name: 'Integrate data',
      isPrimary: false,
      icon: 'integrationGeneral',
      type: 'icon',
      available: (datasource: DataConnection) => datasource.connectionType !== 'PROMETHEUS',
      onClick: () => {},
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
              href={`#/manage/${record.name}`}
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

  const search = {
    box: {
      incremental: true,
    },
  };

  const entries = data.map((dataconnection: DataConnection) => {
    const name = dataconnection.name;
    const connectionType = dataconnection.connectionType;
    const dsStatus = dataconnection.dsStatus;
    return { connectionType, name, dsStatus, data: { name, connectionType } };
  });

  return (
    <EuiPageBody component="div">
      <EuiSpacer size="s" />
      <EuiFlexGroup justifyContent="center">
        <EuiFlexItem grow={false} style={{ width: '100%' }}>
          <EuiInMemoryTable
            items={entries}
            itemId="id"
            columns={tableColumns}
            tableLayout="auto"
            pagination={{
              initialPageSize: 10,
              pageSizeOptions: [5, 10, 15],
            }}
            search={search}
            allowNeutralSort={false}
            isSelectable={true}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {isModalVisible && modalLayout}
    </EuiPageBody>
  );
};
