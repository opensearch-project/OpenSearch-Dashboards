/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Dispatch, SetStateAction, useState } from 'react';
import {
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiTableSelectionType,
  EuiTableActionsColumnType,
  EuiSmallButton,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource } from '../../../common/types';

interface OpenSearchConnectionTableProps {
  assignedDataSources: DataSource[];
  isDashboardAdmin: boolean;
  setAssignedDataSources: (value: DataSource[]) => void;
  setModalVisible: Dispatch<SetStateAction<boolean>>;
}

export const CreatePageOpenSearchConnectionTable = ({
  assignedDataSources,
  setAssignedDataSources,
  isDashboardAdmin,
  setModalVisible,
}: OpenSearchConnectionTableProps) => {
  const [selectedItems, setSelectedItems] = useState<DataSource[]>([]);

  const onSelectionChange = (currentSelectedItems: DataSource[]) => {
    setSelectedItems(currentSelectedItems);
  };

  const handleUnassignDataSources = (dataSources: DataSource[]) => {
    const savedDataSources = (assignedDataSources ?? [])?.filter(
      ({ id }: DataSource) => !dataSources.some((item) => item.id === id)
    );
    setAssignedDataSources(savedDataSources);
    setSelectedItems(savedDataSources);
  };

  const columns: Array<EuiBasicTableColumn<DataSource>> = [
    {
      field: 'title',
      name: i18n.translate('workspace.creator.dataSources.table.title', {
        defaultMessage: 'Title',
      }),
      truncateText: true,
    },
    {
      field: 'dataSourceEngineType',
      name: i18n.translate('workspace.creator.dataSources.table.type', {
        defaultMessage: 'Type',
      }),
      truncateText: true,
    },
    {
      field: 'description',
      name: i18n.translate('workspace.creator.dataSources.table.description', {
        defaultMessage: 'Description',
      }),
      truncateText: true,
    },
    ...(isDashboardAdmin
      ? [
          {
            name: i18n.translate('workspace.creator.dataSources.table.actions', {
              defaultMessage: 'Actions',
            }),
            actions: [
              {
                name: i18n.translate('workspace.creator.dataSources.table.actions.remove.name', {
                  defaultMessage: 'Remove association',
                }),
                isPrimary: true,
                description: i18n.translate(
                  'workspace.creator.dataSources.table.actions.remove.description',
                  {
                    defaultMessage: 'Remove association',
                  }
                ),
                icon: 'unlink',
                type: 'icon',
                onClick: (item: DataSource) => {
                  handleUnassignDataSources([item]);
                },
                'data-test-subj': 'workspace-creator-dataSources-table-actions-remove',
              },
            ],
          } as EuiTableActionsColumnType<any>,
        ]
      : []),
  ];

  const selection: EuiTableSelectionType<DataSource> = {
    selectable: () => isDashboardAdmin,
    onSelectionChange,
  };

  const associationButton = (
    <EuiSmallButton
      onClick={() => setModalVisible(true)}
      data-test-subj="workspace-creator-dataSources-assign-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.addNew', {
        defaultMessage: 'Add data sources',
      })}
    </EuiSmallButton>
  );

  const removeButton = (
    <EuiSmallButton
      color="danger"
      onClick={() => {
        handleUnassignDataSources(selectedItems);
      }}
      data-test-subj="workspace-creator-dataSources-assign-button"
    >
      {i18n.translate('workspace.form.selectDataSourcePanel.remove', {
        defaultMessage: 'Remove selected',
      })}
    </EuiSmallButton>
  );

  return (
    <>
      <EuiFlexGroup alignItems="center">
        {selectedItems.length > 0 && <EuiFlexItem grow={false}>{removeButton}</EuiFlexItem>}
        {isDashboardAdmin && <EuiFlexItem grow={false}>{associationButton}</EuiFlexItem>}
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      {assignedDataSources.length > 0 && (
        <EuiInMemoryTable
          items={assignedDataSources}
          itemId="id"
          columns={columns}
          selection={selection}
        />
      )}
    </>
  );
};
