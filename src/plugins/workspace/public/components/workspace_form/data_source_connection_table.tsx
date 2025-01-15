/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, forwardRef } from 'react';
import {
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiTableActionsColumnType,
  EuiText,
  EuiListGroup,
  EuiListGroupItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiPopoverTitle,
  EuiLink,
  EuiButtonIcon,
  EuiInMemoryTableProps,
  EuiTableSelectionType,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { ConnectionTypeIcon } from './connection_type_icon';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../../core/public';

import './data_source_connection_table.scss';

interface DataSourceConnectionTableProps {
  isDashboardAdmin: boolean;
  connectionType: string;
  onUnlinkDataSource: (dataSources: DataSourceConnection) => void;
  onSelectionChange: (selections: DataSourceConnection[]) => void;
  dataSourceConnections: DataSourceConnection[];
  tableProps?: Pick<
    EuiInMemoryTableProps<DataSourceConnection>,
    'pagination' | 'search' | 'message'
  >;
}

export const DataSourceConnectionTable = forwardRef<
  EuiInMemoryTable<DataSourceConnection>,
  DataSourceConnectionTableProps
>(
  (
    {
      isDashboardAdmin,
      connectionType,
      onUnlinkDataSource,
      onSelectionChange,
      tableProps,
      dataSourceConnections,
    }: DataSourceConnectionTableProps,
    ref
  ) => {
    const [popoversState, setPopoversState] = useState<Record<string, boolean>>({});
    const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<
      Record<string, React.ReactNode>
    >({});
    const {
      services: { http },
    } = useOpenSearchDashboards<CoreStart>();

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
            className="workspace-detail-direct-query-expanded-table"
            rowProps={{
              className: 'workspace-detail-direct-query-expanded-row',
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
        width: '20%',
        field: 'name',
        name: i18n.translate('workspace.detail.dataSources.table.title', {
          defaultMessage: 'Title',
        }),
        truncateText: true,
        render: (name: string, record) => {
          // There is not a detail page for data connection, so we won't display a link here.
          if (record.connectionType === DataSourceConnectionType.DataConnection) {
            return name;
          }
          let url: string;
          if (record.connectionType === DataSourceConnectionType.OpenSearchConnection) {
            url = http.basePath.prepend(`/app/dataSources/${record.id}`);
          } else {
            url = http.basePath.prepend(
              `/app/dataSources/manage/${name}?dataSourceMDSId=${record.parentId}`
            );
          }
          return (
            <EuiLink href={url} className="eui-textTruncate">
              {name}
            </EuiLink>
          );
        },
      },
      {
        width: '20%',
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
        render: (description: string | undefined) => {
          return !!description ? description : <>&mdash;</>;
        },
      },
      {
        width: '140px',
        field: 'relatedConnections',
        name: i18n.translate('workspace.detail.dataSources.table.relatedConnections', {
          defaultMessage: 'Related connections',
        }),
        align: 'right',
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
                    className="direct-query-connection-popover-item"
                    key={item.id}
                    size="xs"
                    label={item.name}
                    icon={<ConnectionTypeIcon type={item.type} />}
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
                    onUnlinkDataSource(item);
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
      <EuiInMemoryTable
        {...tableProps}
        items={dataSourceConnections}
        itemId="id"
        columns={columns}
        isSelectable={true}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        selection={selection}
        className="workspace-detail-direct-query-table"
        ref={ref}
      />
    );
  }
);
