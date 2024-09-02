/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_source_connection_table.scss';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiTableSelectionType,
  EuiTableActionsColumnType,
  EuiConfirmModal,
  EuiSearchBarProps,
  EuiText,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiPopoverTitle,
  EuiSmallButton,
  EuiLink,
  EuiButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { DirectQueryConnectionIcon } from '../workspace_form';

interface DataSourceConnectionTableProps {
  isDashboardAdmin: boolean;
  connectionType: string;
  dataSourceConnections: DataSourceConnection[];
  handleUnassignDataSources: (dataSources: DataSourceConnection[]) => void;
  onSelectedItems?: (dataSources: DataSourceConnection[]) => void;
  inCreatePage?: boolean;
}

export const DataSourceConnectionTable = ({
  isDashboardAdmin,
  connectionType,
  dataSourceConnections,
  handleUnassignDataSources,
  onSelectedItems,
  inCreatePage = false,
}: DataSourceConnectionTableProps) => {
  const [selectedItems, setSelectedItems] = useState<DataSourceConnection[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [popoversState, setPopoversState] = useState<Record<string, boolean>>({});
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<
    Record<string, React.ReactNode>
  >({});
  useEffect(() => {
    if (onSelectedItems) {
      onSelectedItems(selectedItems);
    }
  }, [selectedItems, onSelectedItems, inCreatePage]);

  useEffect(() => {
    // Reset selected items when connectionType changes
    setSelectedItems([]);
    setItemIdToExpandedRowMap({});
  }, [connectionType]);

  const openSearchConnections = useMemo(() => {
    return dataSourceConnections.filter((dsc) =>
      connectionType === AssociationDataSourceModalMode.OpenSearchConnections
        ? dsc.connectionType === DataSourceConnectionType.OpenSearchConnection
        : dsc?.relatedConnections && dsc.relatedConnections?.length > 0
    );
  }, [connectionType, dataSourceConnections]);

  const renderToolsLeft = useCallback(() => {
    return selectedItems.length > 0 && !modalVisible
      ? [
          <EuiSmallButton
            color="danger"
            onClick={() => setModalVisible(true)}
            data-test-subj="workspace-detail-dataSources-table-bulkRemove"
          >
            {i18n.translate('workspace.detail.dataSources.table.remove.button', {
              defaultMessage: 'Remove {numberOfSelect} association(s)',
              values: { numberOfSelect: selectedItems.length },
            })}
          </EuiSmallButton>,
        ]
      : [];
  }, [selectedItems, modalVisible]);

  const onSelectionChange = (selectedDataSources: DataSourceConnection[]) => {
    setSelectedItems(selectedDataSources);
  };

  const search: EuiSearchBarProps = {
    toolsLeft: renderToolsLeft(),
    box: {
      incremental: true,
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'type',
        name: 'Type',
        multiSelect: 'or',
        options: Array.from(
          new Set(openSearchConnections.map(({ type }) => type).filter(Boolean))
        ).map((type) => ({
          value: type!,
          name: type!,
        })),
      },
    ],
  };

  const togglePopover = (itemId: string) => {
    setPopoversState((prevState) => ({
      ...prevState,
      [itemId]: !prevState[itemId],
    }));
  };

  const toggleDetails = (item: DataSourceConnection) => {
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.id]) {
      // When users collapse the expanded row， need to remove its entry from itemIdToExpandedRowMap.
      // The delete operator is used to remove the key-value pair from the object.
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      itemIdToExpandedRowMapValues[item.id] = (
        <EuiInMemoryTable
          items={item?.relatedConnections ?? []}
          itemId="id"
          columns={baseColumns}
          className="customized-table"
          rowProps={{
            className: 'customized-row',
          }}
        />
      );
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  const baseColumns: Array<EuiBasicTableColumn<DataSourceConnection>> = [
    ...(connectionType === AssociationDataSourceModalMode.DirectQueryConnections
      ? [
          {
            width: '40px',
            isExpander: true,
            render: (item: DataSourceConnection) =>
              item?.relatedConnections?.length ? (
                <EuiButtonIcon
                  data-test-subj={`workspace-detail-dataSources-table-dqc-${item.id}-expand-button`}
                  onClick={() => toggleDetails(item)}
                  aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
                  iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
                />
              ) : null,
          },
        ]
      : []),
    {
      width: '25%',
      field: 'name',
      name: i18n.translate('workspace.detail.dataSources.table.title', {
        defaultMessage: 'Title',
      }),
      truncateText: true,
      render: (name: string, record) => {
        const origin = window.location.origin;
        let url: string;
        if (record.connectionType === DataSourceConnectionType.OpenSearchConnection) {
          url = `${origin}/app/dataSources/${record.id}`;
        } else {
          url = `${origin}/app/dataSources/manage/${name}?dataSourceMDSId=${record.parentId}`;
        }
        return (
          <EuiLink href={url} className="eui-textTruncate">
            {name}
          </EuiLink>
        );
      },
    },
    {
      width: '15%',
      field: 'type',
      name: i18n.translate('workspace.detail.dataSources.table.type', {
        defaultMessage: 'Type',
      }),
      truncateText: true,
    },
    {
      field: 'description',
      name: i18n.translate('workspace.detail.dataSources.table.description', {
        defaultMessage: 'Description',
      }),
      truncateText: true,
    },
    {
      width: '140px',
      field: 'relatedConnections',
      name: i18n.translate('workspace.detail.dataSources.table.relatedConnections', {
        defaultMessage: 'Related connections',
      }),
      truncateText: true,
      render: (relatedConnections: DataSourceConnection[], record) =>
        relatedConnections?.length > 0 ? (
          <EuiPopover
            key={record.id}
            panelPaddingSize="s"
            anchorPosition="downRight"
            isOpen={popoversState[record.id] || false}
            closePopover={() => togglePopover(record.id)}
            button={
              <EuiButtonEmpty
                data-test-subj={`workspace-detail-dataSources-table-dqc-${record.id}-related-button`}
                size="xs"
                flush="right"
                color="text"
                onClick={() => togglePopover(record.id)}
              >
                {relatedConnections?.length}
              </EuiButtonEmpty>
            }
          >
            <EuiPopoverTitle>
              {i18n.translate('workspace.detail.dataSources.recentConnections.title', {
                defaultMessage: 'RELATED CONNECTIONS',
              })}
            </EuiPopoverTitle>
            <EuiListGroup
              flush
              maxWidth={217}
              className="eui-yScrollWithShadows"
              style={{ maxHeight: '90px' }}
            >
              {relatedConnections.map((item) => (
                <EuiListGroupItem
                  key={item.id}
                  size="xs"
                  label={item.name}
                  icon={<DirectQueryConnectionIcon type={item.type} />}
                  style={{ maxHeight: '30px' }}
                />
              ))}
            </EuiListGroup>
          </EuiPopover>
        ) : (
          <EuiText>—</EuiText>
        ),
    },
  ];

  const columns: Array<EuiBasicTableColumn<DataSourceConnection>> = [
    ...baseColumns,
    ...(isDashboardAdmin
      ? [
          {
            name: i18n.translate('workspace.detail.dataSources.table.actions', {
              defaultMessage: 'Actions',
            }),
            actions: [
              {
                name: i18n.translate('workspace.detail.dataSources.table.actions.remove.name', {
                  defaultMessage: 'Remove association',
                }),
                isPrimary: true,
                description: i18n.translate(
                  'workspace.detail.dataSources.table.actions.remove.description',
                  {
                    defaultMessage: 'Remove association',
                  }
                ),
                icon: 'unlink',
                type: 'icon',
                onClick: (item: DataSourceConnection) => {
                  if (inCreatePage) {
                    handleUnassignDataSources([item]);
                  } else {
                    setSelectedItems([item]);
                    setModalVisible(true);
                  }
                },
                'data-test-subj': 'workspace-detail-dataSources-table-actions-remove',
              },
            ],
            width: '10%',
          } as EuiTableActionsColumnType<DataSourceConnection>,
        ]
      : []),
  ];

  const selection: EuiTableSelectionType<DataSourceConnection> = {
    selectable: () => isDashboardAdmin,
    onSelectionChange,
  };

  return (
    <>
      {inCreatePage ? (
        <EuiInMemoryTable
          items={openSearchConnections}
          itemId="id"
          columns={columns}
          selection={selection}
          key={connectionType}
          isSelectable={true}
          itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          isExpandable={true}
        />
      ) : (
        <EuiInMemoryTable
          items={openSearchConnections}
          itemId="id"
          columns={columns}
          selection={selection}
          search={search}
          key={connectionType}
          isSelectable={true}
          itemIdToExpandedRowMap={itemIdToExpandedRowMap}
          isExpandable={true}
          pagination={{
            initialPageSize: 10,
            pageSizeOptions: [10, 20, 30],
          }}
        />
      )}
      {modalVisible && (
        <EuiConfirmModal
          data-test-subj="workspaceForm-cancelModal"
          title={i18n.translate('workspace.detail.dataSources.modal.title', {
            defaultMessage: 'Remove data source(s)',
          })}
          onCancel={() => {
            setModalVisible(false);
            setSelectedItems([]);
          }}
          onConfirm={() => {
            setModalVisible(false);
            handleUnassignDataSources(selectedItems);
          }}
          cancelButtonText={i18n.translate('workspace.detail.dataSources.modal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('workspace.detail.dataSources.Modal.confirmButton', {
            defaultMessage: 'Remove data source(s)',
          })}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        />
      )}
    </>
  );
};
