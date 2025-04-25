/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiSmallButton,
  EuiButtonEmpty,
  EuiConfirmModal,
  EuiInMemoryTable,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiSearchBarProps,
  EuiBasicTableColumn,
  EuiButtonIcon,
} from '@elastic/eui';
import React, { useCallback, useState, useRef } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useEffectOnce, useObservable } from 'react-use';
import { of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { TopNavControlComponentData } from 'src/plugins/navigation/public';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import {
  DataSourceManagementContext,
  DataSourceManagementToastMessageItem,
  DataSourceTableItem,
} from '../../types';
import { CreateButton } from '../create_button';
import {
  deleteMultipleDataSources,
  getDataSources,
  setFirstDataSourceAsDefault,
  fetchDataSourceConnections,
} from '../utils';
import { LoadingMask } from '../loading_mask';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';
import './data_source_table.scss';
import { DataSourceEngineType } from '../../../../data_source/common/data_sources';
import { UiSettingScope } from '../../../../../core/public';

/* Table config */
const pagination = {
  initialPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
};

const sorting = {
  sort: {
    field: 'title',
    direction: 'asc' as const,
  },
};

export const DataSourceTable = ({ history }: RouteComponentProps) => {
  const {
    chrome,
    savedObjects,
    http,
    notifications,
    uiSettings,
    application,
    navigation,
    workspaces,
    overlays,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;
  const { HeaderControl } = navigation.ui;
  const workspaceClient = useObservable(workspaces.client$);
  const DataSourceAssociation = workspaceClient?.ui().DataSourceAssociation;
  const defaultDataSourceIdRef = useRef(
    uiSettings.get$<string | null>(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID)
  );
  const defaultDataSourceId = useObservable(defaultDataSourceIdRef.current);
  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  /* Component state variables */
  const [dataSources, setDataSources] = useState<DataSourceTableItem[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceTableItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = React.useState(false);
  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const isDashboardAdmin = !!application?.capabilities?.dashboards?.isDashboardAdmin;
  const canAssociateDataSource = !!currentWorkspace && isDashboardAdmin;
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<
    Record<string, React.ReactNode>
  >({});

  /* useEffectOnce hook to avoid these methods called multiple times when state is updated. */
  useEffectOnce(() => {
    chrome.docTitle.change(
      i18n.translate('dataSourcesManagement.dataSourcesTable.dataSourcesTitle', {
        defaultMessage: 'Data Sources',
      })
    );

    // Create an asyncto await fetchDataSources
    (async () => {
      try {
        await fetchDataSources();
      } finally {
        setIsLoading(false);
      }
    })();
  });

  const associateDataSourceButton = DataSourceAssociation && [
    {
      renderComponent: (
        <DataSourceAssociation
          excludedDataSourceIds={dataSources.map((ds) => ds.id)}
          onComplete={() => fetchDataSources()}
        />
      ),
    } as TopNavControlComponentData,
  ];

  /* Toast Handlers */
  const handleDisplayToastMessage = useCallback(
    ({ message }: DataSourceManagementToastMessageItem) => {
      notifications.toasts.addDanger(message);
    },
    [notifications.toasts]
  );

  const toggleDetails = (item: DataSourceTableItem) => {
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.id]) {
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      itemIdToExpandedRowMapValues[item.id] = (
        <EuiInMemoryTable
          items={item?.relatedConnections ?? []}
          itemId="id"
          columns={columns}
          className="data-source-expanded-table"
          rowProps={{
            className: 'data-source-table-expanded-row',
          }}
        />
      );
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  const fetchDataSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDataSources(savedObjects.client);
      const finalData = await fetchDataSourceConnections(
        response,
        http,
        notifications,
        false,
        false,
        true
      );
      setDataSources(finalData);
    } catch (error) {
      setDataSources([]);
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.dataSourceListing.fetchDataSourceFailMsg', {
          defaultMessage: 'Error occurred while fetching the records for Data sources.',
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleDisplayToastMessage, http, notifications, savedObjects.client]);

  const onDissociate = useCallback(
    async (item: DataSourceTableItem | DataSourceTableItem[]) => {
      const itemsToDissociate = Array<DataSourceTableItem>().concat(item);
      const payload = itemsToDissociate.map((ds) => ({ id: ds.id, type: 'data-source' }));
      const confirmed = await overlays.openConfirm('', {
        title: i18n.translate('dataSourcesManagement.dataSourcesTable.removeAssociation', {
          defaultMessage:
            '{selectionSize, plural, one {Remove # association} other {Remove # associations}}',
          values: { selectionSize: itemsToDissociate.length },
        }),
        buttonColor: 'danger',
      });
      if (confirmed) {
        setIsLoading(true);
        if (workspaceClient && currentWorkspace) {
          await workspaceClient.dissociate(payload, currentWorkspace.id);
          await fetchDataSources();
          setSelectedDataSources([]);
          if (payload.some((p) => p.id === defaultDataSourceId)) {
            setFirstDataSourceAsDefault(savedObjects.client, uiSettings, true);
          }
        }
      }
    },
    [
      currentWorkspace,
      defaultDataSourceId,
      fetchDataSources,
      overlays,
      savedObjects.client,
      uiSettings,
      workspaceClient,
    ]
  );

  /* Table search config */
  const renderToolsLeft = useCallback(() => {
    if (selectedDataSources.length === 0) {
      return [];
    }
    if (canManageDataSource) {
      return [
        <EuiSmallButton
          color="danger"
          onClick={() => {
            setConfirmDeleteVisible(true);
          }}
          data-test-subj="deleteDataSourceConnections"
        >
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.deleteToolLabel"
            defaultMessage="{selectionSize, plural, one {Delete # connection} other {Delete # connections}}"
            values={{ selectionSize: selectedDataSources.length }}
          />
        </EuiSmallButton>,
      ];
    }
    if (canAssociateDataSource) {
      return [
        <EuiSmallButton
          color="danger"
          onClick={() => {
            onDissociate(selectedDataSources);
          }}
          data-test-subj="dissociateSelectedDataSources"
        >
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.dissociateSelectedDataSources"
            defaultMessage="{selectionSize, plural, one {Remove # association} other {Remove # associations}}"
            values={{ selectionSize: selectedDataSources.length }}
          />
        </EuiSmallButton>,
      ];
    }
    return [];
  }, [selectedDataSources, canManageDataSource, canAssociateDataSource, onDissociate]);

  const search: EuiSearchBarProps = {
    toolsLeft: renderToolsLeft(),
    compressed: true,
    box: {
      incremental: true,
      schema: {
        fields: { title: { type: 'string' } },
      },
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'type',
        name: i18n.translate('dataSourcesManagement.dataSourcesTable.type', {
          defaultMessage: 'Type',
        }),
        multiSelect: 'or',
        options: Array.from(new Set(dataSources.map(({ type }) => type).filter(Boolean))).map(
          (type, index) => ({
            key: `type-option-${index}`,
            value: type!,
            name: type!,
          })
        ),
      },
    ],
  };

  /* Table columns */
  const columns: Array<EuiBasicTableColumn<DataSourceTableItem>> = [
    {
      align: 'left',
      width: '40px',
      isExpander: true,
      render: (item: DataSourceTableItem) =>
        item?.relatedConnections?.length ? (
          <EuiButtonIcon
            onClick={() => toggleDetails(item)}
            data-test-subj="expandCollapseButton"
            aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
            iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ) : null,
    },
    {
      field: 'title',
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.dataSourceField', {
        defaultMessage: 'Data source',
      }),
      render: (name: string, item: DataSourceTableItem) => {
        return (
          <>
            <EuiButtonEmpty
              size="xs"
              {...reactRouterNavigate(history, `${item.id}`)}
              className={
                item.type === DataSourceEngineType.OpenSearchCrossCluster
                  ? 'data-source-table-expanded-row_title'
                  : ''
              }
              flush="left"
            >
              {name}
            </EuiButtonEmpty>
            {item.id === defaultDataSourceId ? (
              <EuiBadge iconType="starFilled" iconSide="left">
                Default
              </EuiBadge>
            ) : null}
          </>
        );
      },
      dataType: 'string' as const,
      sortable: ({ title }: { title: string }) => title,
    },
    {
      field: 'type',
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.typeField', {
        defaultMessage: 'Type',
      }),
      truncateText: true,
    },
    {
      field: 'description',
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.descriptionField', {
        defaultMessage: 'Description',
      }),
      truncateText: true,
      mobileOptions: {
        show: false,
      },
      dataType: 'string' as const,
      sortable: ({ description }: { description?: string }) => description,
      render: (description?: string) =>
        !!description && description.length > 0 ? description : <EuiText>&mdash;</EuiText>,
    },
    {
      field: 'relatedConnections',
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.relatedConnectionsField', {
        defaultMessage: 'Related connections',
      }),
      truncateText: true,
      render: (relatedConnections: DataSourceTableItem[]) =>
        relatedConnections && relatedConnections.length > 0 ? (
          relatedConnections.length
        ) : (
          <EuiText>&mdash;</EuiText>
        ),
    },
  ];

  /* render delete modal*/
  const tableRenderDeleteModal = () => {
    return confirmDeleteVisible ? (
      <EuiConfirmModal
        title={i18n.translate('dataSourcesManagement.dataSourcesTable.multiDeleteTitle', {
          defaultMessage: 'Delete data source connection(s)',
        })}
        onCancel={() => {
          setConfirmDeleteVisible(false);
        }}
        onConfirm={() => {
          setConfirmDeleteVisible(false);
          onClickDelete();
        }}
        cancelButtonText={i18n.translate('dataSourcesManagement.dataSourcesTable.cancel', {
          defaultMessage: 'Cancel',
        })}
        confirmButtonText={i18n.translate('dataSourcesManagement.dataSourcesTable.delete', {
          defaultMessage: 'Delete',
        })}
        buttonColor="danger"
        defaultFocusedButton="confirm"
      >
        <p>
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.deleteDescription"
            defaultMessage="This action will delete the selected data source connections"
          />
        </p>
        <p>
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.deleteConfirmation"
            defaultMessage="Any objects created using data from these sources, including Index Patterns, Visualizations, and Observability Panels, will be impacted."
          />
        </p>
        <p>
          <FormattedMessage
            id="dataSourcesManagement.dataSourcesTable.deleteWarning"
            defaultMessage="This action cannot be undone."
          />
        </p>
      </EuiConfirmModal>
    ) : null;
  };

  /* Delete selected data sources*/
  const onClickDelete = () => {
    setIsDeleting(true);

    deleteMultipleDataSources(savedObjects.client, selectedDataSources)
      .then(() => {
        setSelectedDataSources([]);
        // Fetch data sources
        fetchDataSources();
        setConfirmDeleteVisible(false);
        // Check if default data source is deleted or not.
        // if yes, then set the first existing datasource as default datasource.
        setDefaultDataSource();
      })
      .catch(() => {
        handleDisplayToastMessage({
          message: i18n.translate(
            'dataSourcesManagement.dataSourceListing.deleteDataSourceFailMsg',
            {
              defaultMessage:
                'Error occurred while deleting selected records for Data sources. Please try it again',
            }
          ),
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const setDefaultDataSource = async () => {
    try {
      for (const dataSource of selectedDataSources) {
        if (defaultDataSourceId === dataSource.id) {
          await setFirstDataSourceAsDefault(savedObjects.client, uiSettings, true);
          break;
        }
      }
    } catch (e) {
      handleDisplayToastMessage({
        message: i18n.translate(
          'dataSourcesManagement.editDataSource.setDefaultDataSourceFailMsg',
          {
            defaultMessage:
              'Unable to find a default datasource. Please set a new default datasource.',
          }
        ),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /* Table selection handlers */
  const onSelectionChange = (selected: DataSourceTableItem[]) => {
    setSelectedDataSources(selected);
  };

  const selection = {
    onSelectionChange,
  };

  /* Render Ui elements*/
  /* Render table */
  const renderTableContent = () => {
    return (
      <>
        {/* Data sources table*/}
        <EuiInMemoryTable
          allowNeutralSort={false}
          itemId="id"
          itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          isExpandable={true}
          isSelectable={true}
          selection={selection}
          items={dataSources}
          columns={columns}
          pagination={pagination}
          sorting={sorting}
          search={search}
          loading={isLoading}
          className="data-source-table"
        />
      </>
    );
  };

  const renderEmptyState = () => {
    const createButtonEmptyState = (
      <CreateButton
        history={history}
        isEmptyState={true}
        dataTestSubj="createDataSourceButtonEmptyState"
      />
    );

    return (
      <>
        <EuiSpacer size="l" />
        <EuiPanel
          hasBorder={false}
          hasShadow={false}
          style={{ textAlign: 'center' }}
          data-test-subj="datasourceTableEmptyState"
        >
          <EuiText size="s">
            <FormattedMessage
              id="dataSourcesManagement.dataSourcesTable.noData"
              defaultMessage="No Data Source Connections have been created yet."
            />
          </EuiText>
          <EuiSpacer />
          {canManageDataSource ? createButtonEmptyState : null}
        </EuiPanel>
        <EuiSpacer size="l" />
      </>
    );
  };

  const actionColumn: EuiBasicTableColumn<DataSourceTableItem> = {
    name: 'Action',
    actions: [],
  };

  // Add remove association action
  if (canAssociateDataSource) {
    actionColumn.actions.push({
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.removeAssociation.label', {
        defaultMessage: 'Remove association',
      }),
      isPrimary: true,
      description: i18n.translate(
        'dataSourcesManagement.dataSourcesTable.removeAssociation.description',
        {
          defaultMessage: 'Remove association',
        }
      ),
      icon: 'unlink',
      type: 'icon',
      onClick: async (item: DataSourceTableItem) => {
        onDissociate(item);
      },
      'data-test-subj': 'dataSourcesManagement-dataSourceTable-dissociateButton',
    });
  }

  // Add set as default action when data source list page opened within a workspace
  if (currentWorkspace) {
    actionColumn.actions.push({
      render: (item) => {
        return (
          <EuiButtonIcon
            data-test-subj="dataSourcesManagement-dataSourceTable-setAsDefaultButton"
            isDisabled={defaultDataSourceId === item.id}
            aria-label="Set as default data source"
            title={i18n.translate('dataSourcesManagement.dataSourcesTable.setAsDefault.label', {
              defaultMessage: 'Set as default',
            })}
            iconType="flag"
            onClick={async () => {
              await uiSettings.set(
                DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
                item.id,
                UiSettingScope.WORKSPACE
              );
            }}
          />
        );
      },
    });
  }

  if (actionColumn.actions.length > 0) {
    columns.push(actionColumn);
  }

  return (
    <>
      {useUpdatedUX && canAssociateDataSource && associateDataSourceButton && (
        <HeaderControl
          setMountPoint={application.setAppRightControls}
          controls={associateDataSourceButton}
        />
      )}
      {tableRenderDeleteModal()}
      {!isLoading && (!dataSources || !dataSources.length)
        ? renderEmptyState()
        : renderTableContent()}
      {isDeleting ? <LoadingMask /> : null}
    </>
  );
};

export const DataSourceTableWithRouter = withRouter(DataSourceTable);
