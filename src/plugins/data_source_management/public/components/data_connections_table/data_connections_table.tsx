/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../direct_query_data_sources_components/direct_query_data_connection/direct_query_table.scss';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiInMemoryTable,
  EuiSmallButton,
  EuiConfirmModal,
  EuiPageBody,
  EuiPanel,
  EuiSpacer,
  EuiSearchBarProps,
  EuiLoadingSpinner,
  EuiText,
  LEFT_ALIGNMENT,
  EuiButtonEmpty,
  EuiBasicTableColumn,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { TopNavControlComponentData } from 'src/plugins/navigation/public';
import { WorkspaceObject } from 'src/core/public';
import {
  DataSourceConnectionType,
  DataSourceManagementContext,
  DataSourceTableItem,
  DirectQueryDatasourceDetails,
} from '../../types';
import {
  isPluginInstalled,
  fetchDataSourceConnections,
  getDataSources,
  deleteMultipleDataSources,
  getHideLocalCluster,
  getDataConnections,
  setFirstDataSourceAsDefault,
} from '../utils';
import { LoadingMask } from '../loading_mask';
import {
  reactRouterNavigate,
  useOpenSearchDashboards,
} from '../../../../opensearch_dashboards_react/public';
import { DATACONNECTIONS_BASE, LOCAL_CLUSTER } from '../../constants';
import { DatasourceTypeToDisplayName, DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';
import { useDataSourceUpdater } from '../data_source_table/use_data_source_updater';
import { CreateButton } from '../create_button';
import { UiSettingScope } from '../../../../../core/public';
import {
  DataConnectionType,
  DATA_CONNECTION_SAVED_OBJECT_TYPE,
} from '../../../../data_source/common';
import { getDirectQueryConnectionFlowManagePath } from '../direct_query_connection_flow/constants';
import { useVisibleDirectQueryConnectionFlows } from '../direct_query_connection_flow/use_visible_direct_query_connection_flows';
import { useDataConnectionTypeCards } from '../create_data_connection_panel/data_connection_type_cards';
import {
  DirectQueryConnectionFlow,
  findOwningDirectQueryConnectionFlow,
} from '../../direct_query_connection_flow_registry';

const EMPTY_WORKSPACE_LIST$ = of<WorkspaceObject[]>([]);

/**
 * Whether the row is a `data-source` saved object: not a connection nested under one, not the
 * local cluster, and not a `data-connection`. Only these rows can be the default data source.
 */
const isDataSourceRow = (item: DataSourceTableItem) =>
  item.connectionType === DataSourceConnectionType.OpenSearchConnection &&
  !item.parentId &&
  item.id !== LOCAL_CLUSTER;

/** The saved object fields a `data-connection` row keeps for flow ownership at render time. */
interface DataConnectionRowSource {
  attributes: Record<string, any>;
  workspaces?: string[];
}

/**
 * Applies the visible flows to the rows: a `data-connection` row owned by a visible flow links to
 * the flow's manage page and may show the flow's type label, and `data-connection` rows show their
 * description. With no visible flow the rows are returned unchanged.
 */
const applyDirectQueryConnectionFlows = (
  rows: DataSourceTableItem[],
  sources: ReadonlyMap<string, DataConnectionRowSource>,
  flows: DirectQueryConnectionFlow[]
): DataSourceTableItem[] => {
  if (!flows.length) {
    return rows;
  }
  return rows.map((row) => {
    const source = row.objectType === DATA_CONNECTION_SAVED_OBJECT_TYPE && sources.get(row.id);
    if (!source) {
      return row;
    }
    const item: DataSourceTableItem = { ...row };
    const description = source.attributes?.description;
    if (typeof description === 'string') {
      item.description = description;
    }
    const owningFlow = findOwningDirectQueryConnectionFlow(flows, {
      id: row.id,
      attributes: source.attributes,
      workspaces: source.workspaces,
    });
    if (owningFlow) {
      item.directQueryConnectionFlowId = owningFlow.id;
      // The owning flow may label its type (the Type column and filter follow); the stored
      // attributes.type is left as is.
      const typeLabel = typeof owningFlow.typeLabel === 'string' ? owningFlow.typeLabel.trim() : '';
      if (typeLabel) {
        item.type = typeLabel;
      }
    }
    return item;
  });
};

interface DataConnectionsTableProps extends RouteComponentProps {
  featureFlagStatus: boolean;
}

export const DataConnectionsTable = ({ featureFlagStatus, history }: DataConnectionsTableProps) => {
  const {
    application,
    chrome,
    savedObjects,
    http,
    notifications,
    uiSettings,
    navigation,
    workspaces,
    overlays,
    directQueryConnectionFlowRegistry,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;
  const { HeaderControl } = navigation.ui;
  const workspaceClient = useObservable(workspaces.client$);
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const DataSourceAssociation = workspaceClient?.ui().DataSourceAssociation;
  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  const canManageDataSource = !!application.capabilities?.dataSource?.canManage;
  // The empty table offers the Create page, as the home panel does: to data source managers, and to
  // a user with a flow card (a flow may not require data source management).
  const { cards: typeCards } = useDataConnectionTypeCards();
  const canCreate = canManageDataSource || typeCards.length > 0;

  // Flow-specific behaviour (row links, type labels, descriptions, Workspaces column) is only
  // enabled while at least one registered direct query connection flow is visible, consistent
  // with the header buttons and the flow mount point (a flow that requires data source management,
  // the default, is visible only to users who can manage data sources). Rows are fetched right
  // away; flows apply to them at render, each as soon as its own visibility is known.
  const visibleFlows = useVisibleDirectQueryConnectionFlows(
    directQueryConnectionFlowRegistry,
    canManageDataSource
  );
  const flowsEnabled = visibleFlows.length > 0;
  const workspaceList = useObservable(
    flowsEnabled && workspaces?.workspaceList$ ? workspaces.workspaceList$ : EMPTY_WORKSPACE_LIST$
  );
  const isDashboardAdmin = !!application?.capabilities?.dashboards?.isDashboardAdmin;
  const canAssociateDataSource =
    !!currentWorkspace && !currentWorkspace.readonly && isDashboardAdmin;

  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [observabilityDashboardsExists, setObservabilityDashboardsExists] = useState(false);
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [showIntegrationsFlyout, setShowIntegrationsFlyout] = useState(false);
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [integrationsFlyout, setIntegrationsFlyout] = useState<React.JSX.Element | null>(null);

  const [data, setData] = useState<DataSourceTableItem[]>([]);
  // The `data-connection` saved objects of the current rows, by id, for flow ownership at render.
  const [dataConnectionSources, setDataConnectionSources] = useState<
    ReadonlyMap<string, DataConnectionRowSource>
  >(new Map());
  const rows = useMemo(
    () => applyDirectQueryConnectionFlows(data, dataConnectionSources, visibleFlows),
    [data, dataConnectionSources, visibleFlows]
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [selectedDataSources, setSelectedDataSources] = useState<DataSourceTableItem[]>([]);

  // The ids of the expanded rows. Their nested tables are built from the current rows at render, so
  // a refetch shows the current connections under an expanded row.
  const [expandedRowIds, setExpandedRowIds] = useState<ReadonlySet<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // The ids of the rows a flow owns, from the current rows: a row may become flow-owned after it
  // was selected, once its flow's visibility resolves.
  const flowOwnedRowIds = useMemo(
    () => new Set(rows.filter((row) => row.directQueryConnectionFlowId).map((row) => row.id)),
    [rows]
  );
  useEffect(() => {
    setSelectedDataSources((selected) => {
      const kept = selected.filter((item) => !flowOwnedRowIds.has(item.id));
      return kept.length === selected.length ? selected : kept;
    });
  }, [flowOwnedRowIds]);

  /* Table selection handlers */
  const onSelectionChange = (selected: DataSourceTableItem[]) => {
    setSelectedDataSources(selected);
  };

  // A connection a flow owns is deleted only from the flow's own page: bulk Delete removes a
  // data-connection by name through the SQL plugin, which the flow's connections don't go through
  // (and the flow's application may not let users delete them as saved objects).
  const selection = featureFlagStatus && {
    onSelectionChange,
    selectable: (item: DataSourceTableItem) => {
      return item.id !== LOCAL_CLUSTER && !item.directQueryConnectionFlowId;
    },
    // Names why a flow's connection can't be selected; other rows keep the default label.
    selectableMessage: (selectable: boolean, item: DataSourceTableItem) =>
      !selectable && item.directQueryConnectionFlowId
        ? i18n.translate('dataSourcesManagement.directQueryTable.flowConnectionNotSelectable', {
            defaultMessage: '{title} is managed on its own page. Remove it from its page.',
            values: { title: item.title },
          })
        : undefined,
  };

  const fetchDataSources = useCallback(() => {
    setIsLoading(true);

    const fetchOpenSearchConnections = async (): Promise<DataSourceTableItem[]> => {
      const fetchConnections = featureFlagStatus
        ? getDataSources(savedObjects.client)
        : http.get(`${DATACONNECTIONS_BASE}`);

      return fetchConnections
        .then((response) => {
          return featureFlagStatus
            ? fetchDataSourceConnections(
                response,
                http,
                notifications,
                true,
                getHideLocalCluster().enabled,
                // Cross-cluster connections show under their data source, as on the former
                // OpenSearch connections tab.
                true
              )
            : response.map((dataConnection: DirectQueryDatasourceDetails) => ({
                id: dataConnection.name,
                title: dataConnection.name,
                type:
                  {
                    S3GLUE: DatasourceTypeToDisplayName.S3GLUE,
                    PROMETHEUS: DatasourceTypeToDisplayName.PROMETHEUS,
                  }[dataConnection.connector] || dataConnection.connector,
                connectionType: dataConnection.connector,
                description: dataConnection.description,
              }));
        })
        .then((finalData) => {
          // Every data source is listed. The local cluster has no saved object of its own, so it
          // is listed only when it has direct query connections to show.
          return featureFlagStatus
            ? finalData.filter(
                (item: DataSourceTableItem) =>
                  item.id !== LOCAL_CLUSTER || !!item.relatedConnections?.length
              )
            : finalData;
        })
        .catch(() => {
          notifications.toasts.addDanger(
            i18n.translate('dataSourcesManagement.directQueryTable.fetchDataSources', {
              defaultMessage: 'Could not fetch data sources',
            })
          );
          return [];
        });
    };

    const fetchDirectQueryConnections = async (): Promise<{
      items: DataSourceTableItem[];
      sources: Map<string, DataConnectionRowSource>;
    }> => {
      const sources = new Map<string, DataConnectionRowSource>();
      try {
        const dataConnectionSavedObjects = await getDataConnections(savedObjects.client);
        const items = dataConnectionSavedObjects.map((obj) => {
          sources.set(obj.id, { attributes: obj.attributes, workspaces: obj.workspaces });
          return {
            id: obj.id,
            title: obj.attributes.connectionId,
            type: obj.attributes.type,
            // This represents this is data connection type saved object not data source type saved object
            objectType: DATA_CONNECTION_SAVED_OBJECT_TYPE,
            ...(obj.workspaces ? { workspaces: obj.workspaces } : {}),
          } as DataSourceTableItem;
        });
        return { items, sources };
      } catch (error: any) {
        return { items: [], sources };
      }
    };

    const fetchAllData = async (): Promise<DataSourceTableItem[]> => {
      try {
        const [openSearchConnections, directQueryConnections] = await Promise.all([
          fetchOpenSearchConnections(),
          fetchDirectQueryConnections(),
        ]);
        const fetchedRows = [...openSearchConnections, ...directQueryConnections.items];
        setDataConnectionSources(directQueryConnections.sources);
        setData(fetchedRows);
        return fetchedRows;
      } catch (error) {
        notifications.toasts.addDanger(
          i18n.translate('dataSourcesManagement.directQueryTable.fetchAllConnections', {
            defaultMessage: 'Could not fetch OpenSearch and Direct Query Connections',
          })
        );
        return [];
      } finally {
        setIsLoading(false);
      }
    };

    return fetchAllData();
  }, [http, savedObjects, notifications, featureFlagStatus]);

  // The default data source, shown and managed as on the former OpenSearch connections tab.
  const [defaultDataSourceId, setDefaultDataSourceId] = useState<string | null>(null);
  const defaultDataSourceIdRef = useRef<string | null>(null);
  defaultDataSourceIdRef.current = defaultDataSourceId;

  const loadDefaultDataSourceId = useCallback(async () => {
    try {
      const scope = !!workspaces.currentWorkspace$.getValue()
        ? UiSettingScope.WORKSPACE
        : UiSettingScope.GLOBAL;
      const id = await uiSettings.getUserProvidedWithScope<string | null>(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        scope
      );
      setDefaultDataSourceId(id);
    } catch (error) {
      notifications.toasts.addWarning(error.message);
    }
  }, [uiSettings, workspaces.currentWorkspace$, notifications.toasts]);

  // Only data sources can become the default after an association.
  const fetchDataSourceRows = useCallback(
    async () => (await fetchDataSources()).filter(isDataSourceRow),
    [fetchDataSources]
  );
  const { handleDataSourceUpdated } = useDataSourceUpdater({
    fetchDataSources: fetchDataSourceRows,
    defaultDataSourceIdRef,
    uiSettings,
    loadDefaultDataSourceId,
    notifications,
    currentWorkspace,
  });

  // A deleted or dissociated default data source is replaced by the first remaining one. This has
  // its own message: the removal itself succeeded.
  const replaceRemovedDefaultDataSource = useCallback(
    async (removedIds: string[]) => {
      if (!defaultDataSourceId || !removedIds.includes(defaultDataSourceId)) {
        return;
      }
      // `uiSettings.set` resolves false when the save fails; undefined means no data source is
      // left to be the default.
      let replaced: boolean | undefined = false;
      try {
        replaced = await setFirstDataSourceAsDefault(
          savedObjects.client,
          uiSettings,
          true,
          currentWorkspace ? UiSettingScope.WORKSPACE : UiSettingScope.GLOBAL
        );
        await loadDefaultDataSourceId();
      } catch {
        replaced = false;
      }
      if (replaced === false) {
        notifications.toasts.addDanger(
          i18n.translate('dataSourcesManagement.editDataSource.setDefaultDataSourceFailMsg', {
            defaultMessage:
              'Unable to find a default datasource. Please set a new default datasource.',
          })
        );
      }
    },
    [
      currentWorkspace,
      defaultDataSourceId,
      loadDefaultDataSourceId,
      notifications.toasts,
      savedObjects.client,
      uiSettings,
    ]
  );

  /* Delete selected data sources*/
  const onClickDelete = () => {
    // A connection a flow owns is never deleted from here, even when it was selected before its
    // flow was known.
    const deletedItems = selectedDataSources.filter((item) => !flowOwnedRowIds.has(item.id));
    if (deletedItems.length === 0) {
      setSelectedDataSources([]);
      return;
    }
    setIsDeleting(true);

    deleteMultipleDataSources(savedObjects.client, deletedItems, http)
      .then(() => {
        setSelectedDataSources([]);
        // Fetch data sources
        fetchDataSources();
        setIsModalVisible(false);
        replaceRemovedDefaultDataSource(deletedItems.map((deleted) => deleted.id));
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

  const onDissociate = useCallback(
    async (item: DataSourceTableItem | DataSourceTableItem[]) => {
      const itemsToDissociate = Array<DataSourceTableItem>().concat(item);
      const payload = itemsToDissociate.map((ds) => ({
        id: ds.id,
        type:
          ds?.objectType === DATA_CONNECTION_SAVED_OBJECT_TYPE
            ? DATA_CONNECTION_SAVED_OBJECT_TYPE
            : 'data-source',
      }));
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
        const removeAssociationFailed = (failedCount: number) =>
          notifications.toasts.addDanger(
            i18n.translate('dataSourcesManagement.directQueryTable.removeAssociationFailMsg', {
              defaultMessage:
                'Could not remove {failedCount, plural, one {# association} other {# associations}}. Please try it again',
              values: { failedCount },
            })
          );
        try {
          if (workspaceClient && currentWorkspace) {
            // The client doesn't throw: a failed request resolves `success: false`, and an object
            // the server refused comes back with an `error` (as the Associate modal reads it).
            const response = await workspaceClient.dissociate(payload, currentWorkspace.id);
            const failedIds = new Set(
              response.success
                ? response.result.filter((result) => !!result.error).map((result) => result.id)
                : payload.map((p) => p.id)
            );
            const dissociatedIds = payload.map((p) => p.id).filter((id) => !failedIds.has(id));
            if (failedIds.size > 0) {
              removeAssociationFailed(failedIds.size);
            }
            if (dissociatedIds.length > 0) {
              await fetchDataSources();
              setSelectedDataSources([]);
              await replaceRemovedDefaultDataSource(dissociatedIds);
            }
          }
        } catch {
          // Not expected from the workspace client; nothing is known to be removed.
          removeAssociationFailed(payload.length);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [
      currentWorkspace,
      fetchDataSources,
      notifications.toasts,
      overlays,
      replaceRemovedDefaultDataSource,
      workspaceClient,
    ]
  );

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
    if (selectedDataSources.length === 0) {
      return [];
    }
    if (canManageDataSource) {
      return [
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

  const toggleDetails = (item: DataSourceTableItem) => {
    setExpandedRowIds((ids) => {
      const next = new Set(ids);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const isExpanded = (item: DataSourceTableItem) =>
    expandedRowIds.has(item.id) && !!item.relatedConnections?.length;

  useEffect(() => {
    fetchDataSources();
    isPluginInstalled('plugin:observabilityDashboards', notifications, http).then(
      setObservabilityDashboardsExists
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataSources]);

  useEffect(() => {
    // Data sources, the only rows that can be the default, are listed only with multiple data
    // sources enabled.
    if (featureFlagStatus) {
      loadDefaultDataSourceId();
    }
  }, [featureFlagStatus, loadDefaultDataSourceId]);

  useEffect(() => {
    // The browser tab title, as set by the former OpenSearch connections tab.
    if (featureFlagStatus) {
      chrome.docTitle.change(
        i18n.translate('dataSourcesManagement.dataSourcesTable.dataSourcesTitle', {
          defaultMessage: 'Data Sources',
        })
      );
    }
  }, [chrome, featureFlagStatus]);

  const tableColumns = [
    featureFlagStatus && {
      align: LEFT_ALIGNMENT,
      width: '40px',
      isExpander: true,
      render: (item: DataSourceTableItem) =>
        item?.relatedConnections?.length ? (
          <EuiButtonIcon
            onClick={() => toggleDetails(item)}
            aria-label={
              isExpanded(item)
                ? i18n.translate('dataSourcesManagement.directQueryTable.collapseRow', {
                    defaultMessage: 'Collapse',
                  })
                : i18n.translate('dataSourcesManagement.directQueryTable.expandRow', {
                    defaultMessage: 'Expand',
                  })
            }
            iconType={isExpanded(item) ? 'arrowUp' : 'arrowDown'}
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
        if (record.directQueryConnectionFlowId) {
          const flowLocation = {
            pathname: getDirectQueryConnectionFlowManagePath(
              record.directQueryConnectionFlowId,
              record.id
            ),
          };
          return (
            // href keeps "open in new tab"; onClick navigates in the app without a reload.
            // eslint-disable-next-line @elastic/eui/href-or-on-click
            <EuiButtonEmpty
              size="xs"
              href={history.createHref(flowLocation)}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                history.push(flowLocation);
              }}
              flush="left"
              data-test-subj={`directQueryConnectionFlowLink-${record.id}`}
            >
              {name}
            </EuiButtonEmpty>
          );
        }
        // Only the connections under a data source are indented: its direct query and
        // cross-cluster connections, shown when its row is expanded. Data connections are saved
        // objects of their own, listed at the top level.
        const indentStyle = featureFlagStatus && record.parentId ? { marginLeft: '20px' } : {};
        if (record.connectionType === DataSourceConnectionType.OpenSearchConnection) {
          // In-app navigation to the data source page; the href keeps "open in new tab".
          return (
            <>
              <EuiButtonEmpty
                size="xs"
                {...reactRouterNavigate(history, record.id)}
                style={indentStyle}
                disabled={record.id === LOCAL_CLUSTER}
                flush="left"
              >
                {name}
              </EuiButtonEmpty>
              {isDataSourceRow(record) && record.id === defaultDataSourceId ? (
                <EuiBadge iconType="starFilled" iconSide="left">
                  {i18n.translate('dataSourcesManagement.directQueryTable.defaultBadge', {
                    defaultMessage: 'Default',
                  })}
                </EuiBadge>
              ) : null}
            </>
          );
        }
        if (
          record.objectType === DATA_CONNECTION_SAVED_OBJECT_TYPE &&
          record.type !== DataConnectionType.Prometheus
        ) {
          // The details page shows direct query connections, as Prometheus data connections also
          // are. Other data connections that no flow owns have no page, so they show their name.
          return <span style={indentStyle}> {name}</span>;
        }
        const path = `manage/${name}${
          record.parentId && record.parentId !== LOCAL_CLUSTER
            ? `?dataSourceMDSId=${record.parentId}`
            : ''
        }`;
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
      sortable: true,
      mobileOptions: {
        show: false,
      },
      render: (description?: string) => (description ? description : '—'),
    },
    flowsEnabled && {
      field: 'workspaces',
      name: i18n.translate('dataSourcesManagement.directQueryTable.workspacesField', {
        defaultMessage: 'Workspaces',
      }),
      truncateText: true,
      render: (workspaceIds?: string[]) => {
        if (!workspaceIds?.length) {
          return '—';
        }
        // Workspaces the user can't see (or that no longer exist) are counted, not shown by id.
        const names: string[] = [];
        let unavailable = 0;
        workspaceIds.forEach((id) => {
          const name = workspaceList?.find((workspace) => workspace.id === id)?.name;
          if (name) {
            names.push(name);
          } else {
            unavailable++;
          }
        });
        if (unavailable > 0) {
          names.push(
            i18n.translate('dataSourcesManagement.directQueryTable.unavailableWorkspaces', {
              defaultMessage:
                '{count, plural, one {# unavailable workspace} other {# unavailable workspaces}}',
              values: { count: unavailable },
            })
          );
        }
        // Break only between words: the cell would otherwise split a name such as
        // "Observability" to fit the column.
        return <span className="eui-textBreakNormal">{names.join(', ')}</span>;
      },
    },
    featureFlagStatus && {
      field: 'relatedConnections',
      name: i18n.translate('dataSourcesManagement.directQueryTable.relatedConnectionsField', {
        defaultMessage: 'Related connections',
      }),
      align: 'right',
      truncateText: true,
      render: (relatedConnections: DataSourceTableItem[]) =>
        relatedConnections?.length ? relatedConnections.length : '—',
    },
  ].filter(Boolean) as Array<EuiBasicTableColumn<DataSourceTableItem>>;

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
        options: Array.from(new Set(rows.map(({ type }) => type).filter(Boolean))).map((type) => ({
          value: type!,
          name: type!,
          view: <>{type}</>,
        })),
      },
    ],
  };

  const associateDataSourceButton = DataSourceAssociation && [
    {
      renderComponent: (
        <DataSourceAssociation
          excludedDataSourceIds={data.map((ds) => ds.id)}
          onComplete={() => handleDataSourceUpdated()}
        />
      ),
    } as TopNavControlComponentData,
  ];

  // With multiple data sources enabled, an empty list offers to create the first connection, as
  // the former OpenSearch connections tab did.
  const renderEmptyState = () => (
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
        {canCreate ? (
          <CreateButton
            history={history}
            isEmptyState={true}
            featureFlagStatus={featureFlagStatus}
            dataTestSubj="createDataSourceButtonEmptyState"
          />
        ) : null}
      </EuiPanel>
      <EuiSpacer size="l" />
    </>
  );

  const actionColumn: EuiBasicTableColumn<DataSourceTableItem> = {
    name: i18n.translate('dataSourcesManagement.directQueryTable.actionField', {
      defaultMessage: 'Action',
    }),
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

  // Set as default, for data sources, when the list is opened within a workspace. A standard EUI
  // action (name + icon) so the label also shows in the collapsed "all actions" popover.
  if (featureFlagStatus && currentWorkspace) {
    actionColumn.actions.push({
      name: i18n.translate('dataSourcesManagement.dataSourcesTable.setAsDefault.label', {
        defaultMessage: 'Set as default',
      }),
      description: i18n.translate('dataSourcesManagement.dataSourcesTable.setAsDefault.label', {
        defaultMessage: 'Set as default',
      }),
      icon: 'flag',
      type: 'icon',
      available: (item: DataSourceTableItem) => isDataSourceRow(item),
      enabled: (item: DataSourceTableItem) => defaultDataSourceId !== item.id,
      onClick: async (item: DataSourceTableItem) => {
        let saved: boolean;
        try {
          // Resolves false when the save fails, and core already shows a toast for that. Throws
          // only for a setting it may not change, which core does not report.
          saved = await uiSettings.set(
            DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
            item.id,
            UiSettingScope.WORKSPACE
          );
        } catch {
          notifications.toasts.addDanger(
            i18n.translate('dataSourcesManagement.directQueryTable.setAsDefaultFailMsg', {
              defaultMessage: 'Could not set {title} as the default data source',
              values: { title: item.title },
            })
          );
          return;
        }
        if (saved) {
          setDefaultDataSourceId(item.id);
        }
      },
      'data-test-subj': 'dataSourcesManagement-dataSourceTable-setAsDefaultButton',
    });
  }

  if (actionColumn.actions.length > 0) {
    tableColumns.push(actionColumn);
  }

  // The nested tables of the expanded rows, from the current rows. Like the tables used while data
  // connections are off, nested rows keep the Action column.
  const itemIdToExpandedRowMap: Record<string, React.ReactNode> = {};
  rows.filter(isExpanded).forEach((item) => {
    itemIdToExpandedRowMap[item.id] = (
      <EuiInMemoryTable
        items={item.relatedConnections ?? []}
        itemId="id"
        // Related connections belong to their data source and have no workspaces of their own.
        columns={tableColumns.filter(
          (column) => (column as { field?: string }).field !== 'workspaces'
        )}
        className="direct-query-expanded-table"
        rowProps={{
          className: 'direct-query-expanded-row',
        }}
      />
    );
  });

  return (
    <EuiPageBody component="div">
      {useUpdatedUX && canAssociateDataSource && associateDataSourceButton && (
        <HeaderControl
          setMountPoint={application.setAppRightControls}
          controls={associateDataSourceButton}
        />
      )}
      <EuiFlexGroup justifyContent="center">
        {tableRenderDeleteModal()}
        <EuiFlexItem grow={false} style={{ width: '100%' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <EuiLoadingSpinner size="xl" />
              <EuiSpacer size="m" />
              <EuiText>
                {i18n.translate('dataSourcesManagement.directQueryTable.loadingConnections', {
                  defaultMessage: 'Loading connections...',
                })}
              </EuiText>
            </div>
          ) : featureFlagStatus && rows.length === 0 ? (
            renderEmptyState()
          ) : (
            <EuiInMemoryTable
              items={rows}
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
                pageSizeOptions: [5, 10, 25, 50],
              }}
              allowNeutralSort={false}
              isSelectable={true}
              // @ts-expect-error TS2322 TODO(ts-error): fixme
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

export const DataConnectionsTableWithRouter = withRouter(DataConnectionsTable);
