/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './direct_query_table.scss';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiInMemoryTable,
  EuiSmallButton,
  EuiConfirmModal,
  EuiPageBody,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiSearchBarProps,
  EuiLoadingSpinner,
  EuiText,
  LEFT_ALIGNMENT,
  EuiButtonEmpty,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import {
  DataSourceConnectionType,
  DataSourceManagementContext,
  DataSourceTableItem,
  DirectQueryDatasourceDetails,
} from '../../../types';
import {
  isPluginInstalled,
  fetchDataSourceConnections,
  getDataSources,
  deleteMultipleDataSources,
  getDefaultDataSourceId,
  setFirstDataSourceAsDefault,
  getHideLocalCluster,
} from '../../utils';
import { LoadingMask } from '../../loading_mask';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DATACONNECTIONS_BASE, LOCAL_CLUSTER } from '../../../constants';

interface DirectQueryDataConnectionsProps extends RouteComponentProps {
  featureFlagStatus: boolean;
}

export const ManageDirectQueryDataConnectionsTable = ({
  featureFlagStatus,
  history,
}: DirectQueryDataConnectionsProps) => {
  const { savedObjects, http, notifications, uiSettings } = useOpenSearchDashboards<
    DataSourceManagementContext
  >().services;
  const [observabilityDashboardsExists, setObservabilityDashboardsExists] = useState(false);
  const [showIntegrationsFlyout, setShowIntegrationsFlyout] = useState(false);
  const [integrationsFlyout, setIntegrationsFlyout] = useState<React.JSX.Element | null>(null);

  const [data, setData] = useState<DataSourceTableItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceTableItem[]>([]);

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<
    Record<string, React.ReactNode>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* Table selection handlers */
  const onSelectionChange = (selected: DataSourceTableItem[]) => {
    setSelectedDataSources(selected);
  };

  const selection = featureFlagStatus && {
    onSelectionChange,
    selectable: (item: DataSourceTableItem) => {
      return item.id !== LOCAL_CLUSTER;
    },
  };

  const setDefaultDataSource = async () => {
    try {
      for (const dataSource of selectedDataSources) {
        if (getDefaultDataSourceId(uiSettings) === dataSource.id) {
          await setFirstDataSourceAsDefault(savedObjects.client, uiSettings, true);
          break;
        }
      }
    } catch (e) {
      notifications.toasts.addDanger(
        i18n.translate('dataSourcesManagement.directQueryTable.setDefaultDataSourceFailMsg', {
          defaultMessage:
            'No default data source has been set. Please select a new default data source.',
        })
      );
    } finally {
      setIsDeleting(false);
    }
  };

  /* Delete selected data sources*/
  const onClickDelete = () => {
    setIsDeleting(true);

    deleteMultipleDataSources(savedObjects.client, selectedDataSources)
      .then(() => {
        setSelectedDataSources([]);
        // Fetch data sources
        fetchDataSources();
        setIsModalVisible(false);
        // Check if default data source is deleted or not.
        // if yes, then set the first existing datasource as default datasource.
        setDefaultDataSource();
      })
      .catch(() => {
        notifications.toasts.addDanger(
          i18n.translate('dataSourcesManagement.directQueryTable.deleteDataSourceFailMsg', {
            defaultMessage:
              'An error occurred while attempting to delete the selected data sources. Please try it again',
          })
        );
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  /* render delete modal*/
  const tableRenderDeleteModal = () => {
    return isModalVisible ? (
      <EuiConfirmModal
        title={i18n.translate('dataSourcesManagement.directQueryTable.multiDeleteTitle', {
          defaultMessage: 'Delete data source connection(s)',
        })}
        onCancel={() => {
          setIsModalVisible(false);
        }}
        onConfirm={() => {
          setIsModalVisible(false);
          onClickDelete();
        }}
        cancelButtonText={i18n.translate('dataSourcesManagement.directQueryTable.cancel', {
          defaultMessage: 'Cancel',
        })}
        confirmButtonText={i18n.translate('dataSourcesManagement.directQueryTable.delete', {
          defaultMessage: 'Delete',
        })}
        buttonColor="danger"
        defaultFocusedButton="confirm"
      >
        <p>
          <FormattedMessage
            id="dataSourcesManagement.directQueryTable.deleteDescription"
            defaultMessage="This action will delete the selected data source connections"
          />
        </p>
        <p>
          <FormattedMessage
            id="dataSourcesManagement.directQueryTable.deleteConfirmation"
            defaultMessage="Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted."
          />
        </p>
        <p>
          <FormattedMessage
            id="dataSourcesManagement.directQueryTable.deleteWarning"
            defaultMessage="This action cannot be undone."
          />
        </p>
      </EuiConfirmModal>
    ) : null;
  };

  const renderToolsLeft = useCallback(() => {
    return selectedDataSources.length > 0
      ? [
          <EuiSmallButton
            color="danger"
            onClick={() => setIsModalVisible(true)}
            data-test-subj="deleteDataSourceConnections"
          >
            <FormattedMessage
              id="dataSourcesManagement.directQueryTable.deleteToolLabel"
              defaultMessage="{selectionSize, plural, one {Delete # connection} other {Delete # connections}}"
              values={{ selectionSize: selectedDataSources.length }}
            />
          </EuiSmallButton>,
        ]
      : [];
  }, [selectedDataSources]);

  const toggleDetails = (item: DataSourceTableItem) => {
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.id]) {
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      itemIdToExpandedRowMapValues[item.id] = (
        <EuiInMemoryTable
          items={item?.relatedConnections ?? []}
          itemId="id"
          columns={tableColumns}
          className="direct-query-expanded-table"
          rowProps={{
            className: 'direct-query-expanded-row',
          }}
        />
      );
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  const fetchDataSources = useCallback(() => {
    setIsLoading(true);

    const fetchConnections = featureFlagStatus
      ? getDataSources(savedObjects.client)
      : http.get(`${DATACONNECTIONS_BASE}`);

    fetchConnections
      .then((response) => {
        return featureFlagStatus
          ? fetchDataSourceConnections(
              response,
              http,
              notifications,
              true,
              getHideLocalCluster().enabled
            )
          : response.map((dataConnection: DirectQueryDatasourceDetails) => ({
              id: dataConnection.name,
              title: dataConnection.name,
              type:
                {
                  S3GLUE: 'Amazon S3',
                  PROMETHEUS: 'Prometheus',
                }[dataConnection.connector] || dataConnection.connector,
              connectionType: dataConnection.connector,
              description: dataConnection.description,
            }));
      })
      .then((finalData) => {
        setData(
          featureFlagStatus
            ? finalData.filter((item) => item.relatedConnections?.length > 0)
            : finalData
        );
      })
      .catch(() => {
        setData([]);
        notifications.toasts.addDanger(
          i18n.translate('dataSourcesManagement.directQueryTable.fetchDataSources', {
            defaultMessage: 'Could not fetch data sources',
          })
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [http, savedObjects, notifications, featureFlagStatus]);

  useEffect(() => {
    fetchDataSources();
    isPluginInstalled('plugin:observabilityDashboards', notifications, http).then(
      setObservabilityDashboardsExists
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataSources]);

  const tableColumns = [
    featureFlagStatus && {
      align: LEFT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      render: (item: DataSourceTableItem) =>
        item?.relatedConnections?.length ? (
          <EuiButtonIcon
            onClick={() => toggleDetails(item)}
            aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ) : null,
    },
    {
      width: '32%',
      field: 'title',
      name: i18n.translate('dataSourcesManagement.directQueryTable.dataSourceField', {
        defaultMessage: 'Data source',
      }),
      sortable: true,
      truncateText: true,
      render: (name: string, record: DataSourceTableItem) => {
        const path =
          record.connectionType === DataSourceConnectionType.OpenSearchConnection
            ? record.id
            : `manage/${name}${
                record.parentId && record.parentId !== LOCAL_CLUSTER
                  ? `?dataSourceMDSId=${record.parentId}`
                  : ''
              }`;

        const indentStyle =
          featureFlagStatus &&
          record.connectionType !== DataSourceConnectionType.OpenSearchConnection
            ? { marginLeft: '20px' }
            : {};
        return (
          <EuiButtonEmpty
            size="xs"
            href={`${window.location.href.replace(/\/$/, '')}/${path}`}
            style={indentStyle}
            disabled={record.id === LOCAL_CLUSTER}
            flush="left"
          >
            {name}
          </EuiButtonEmpty>
        );
      },
    },
    {
      width: '22%',
      field: 'type',
      name: i18n.translate('dataSourcesManagement.directQueryTable.typeField', {
        defaultMessage: 'Type',
      }),
      truncateText: true,
    },
    {
      width: '45%',
      field: 'description',
      name: i18n.translate('dataSourcesManagement.directQueryTable.descriptionField', {
        defaultMessage: 'Description',
      }),
      truncateText: true,
      mobileOptions: {
        show: false,
      },
    },
    featureFlagStatus && {
      field: 'relatedConnections',
      name: i18n.translate('dataSourcesManagement.directQueryTable.relatedConnectionsField', {
        defaultMessage: 'Related connections',
      }),
      align: 'right',
      truncateText: true,
      render: (relatedConnections: DataSourceTableItem[]) => relatedConnections?.length,
    },
  ].filter(Boolean) as Array<EuiTableFieldDataColumnType<DataSourceTableItem>>;

  const customSearchBar: EuiSearchBarProps = {
    toolsLeft: renderToolsLeft(),
    box: {
      incremental: true,
    },
    compressed: true,
    filters: [
      {
        type: 'field_value_selection',
        field: 'type',
        name: i18n.translate('dataSourcesManagement.directQueryTable.type', {
          defaultMessage: 'Type',
        }),
        multiSelect: 'or',
        options: Array.from(new Set(data.map(({ type }) => type).filter(Boolean))).map((type) => ({
          value: type!,
          name: type!,
          view: <>{type}</>,
        })),
      },
    ],
  };

  return (
    <EuiPageBody component="div">
      <EuiFlexGroup justifyContent="center">
        {tableRenderDeleteModal()}
        <EuiFlexItem grow={false} style={{ width: '100%' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <EuiLoadingSpinner size="xl" />
              <EuiSpacer size="m" />
              <EuiText>Loading direct query data connections...</EuiText>
            </div>
          ) : (
            <EuiInMemoryTable
              items={data}
              itemId="id"
              itemIdToExpandedRowMap={itemIdToExpandedRowMap}
              isExpandable={true}
              sorting={{
                sort: {
                  field: 'title',
                  direction: 'asc' as const,
                },
              }}
              columns={tableColumns}
              tableLayout="auto"
              pagination={{
                initialPageSize: 10,
                pageSizeOptions: [5, 10, 15],
              }}
              allowNeutralSort={false}
              isSelectable={true}
              selection={selection}
              search={customSearchBar}
              className="direct-query-table"
            />
          )}
        </EuiFlexItem>
        {isDeleting ? <LoadingMask /> : null}
      </EuiFlexGroup>
      {showIntegrationsFlyout && integrationsFlyout}
    </EuiPageBody>
  );
};

export const ManageDirectQueryDataConnectionsTableWithRouter = withRouter(
  ManageDirectQueryDataConnectionsTable
);
