/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  EuiSpacer,
  EuiButton,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFieldSearch,
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiTableSelectionType,
  EuiTableActionsColumnType,
  EuiConfirmModal,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataSource } from '../../../common/types';
import { useWorkspaceFormContext } from './workspace_form_context';

interface OpenSearchConnectionTableProps {
  assignedDataSources: DataSource[];
  isDashboardAdmin: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CreatePageOpenSearchConnectionTable = ({
  assignedDataSources,
  isDashboardAdmin,
  setIsLoading,
}: OpenSearchConnectionTableProps) => {
  const { formData, setSelectedDataSources } = useWorkspaceFormContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [SelectedItems, setSelectedItems] = useState<DataSource[]>([]);
  const [assignItems, setAssignItems] = useState<DataSource[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredDataSources = useMemo(
    () =>
      assignedDataSources.filter((dataSource) =>
        dataSource.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, assignedDataSources]
  );

  const onSelectionChange = (selectedItems: DataSource[]) => {
    setSelectedItems(selectedItems);
    setAssignItems(selectedItems);
  };

  const handleUnassignDataSources = async (dataSources: DataSource[]) => {
    setIsLoading(true);
    setModalVisible(false);
    const { selectedDataSources } = formData;
    const savedDataSources = (selectedDataSources ?? [])?.filter(
      ({ id }: DataSource) => !dataSources.some((item) => item.id === id)
    );
    setSelectedDataSources(savedDataSources);
    setIsLoading(false);
  };

  const columns: Array<EuiBasicTableColumn<DataSource>> = [
    {
      field: 'title',
      name: i18n.translate('workspace.detail.dataSources.table.title', {
        defaultMessage: 'Title',
      }),
      truncateText: true,
    },
    {
      field: 'dataSourceEngineType',
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
                onClick: (item: DataSource) => {
                  setAssignItems([item]);
                  setModalVisible(true);
                },
                'data-test-subj': 'workspace-detail-dataSources-table-actions-remove',
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

  return (
    <>
      <EuiInMemoryTable
        items={filteredDataSources}
        itemId="id"
        columns={columns}
        selection={selection}
        pagination={{
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 30],
        }}
      />
      <EuiSpacer />
      {modalVisible && (
        <EuiConfirmModal
          data-test-subj="workspaceForm-cancelModal"
          title={i18n.translate('workspace.detail.dataSources.modal.title', {
            defaultMessage: 'Remove OpenSearch connections',
          })}
          onCancel={() => {
            setModalVisible(false);
          }}
          onConfirm={() => {
            handleUnassignDataSources(assignItems);
          }}
          cancelButtonText={i18n.translate('workspace.detail.dataSources.modal.cancelButton', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('workspace.detail.dataSources.Modal.confirmButton', {
            defaultMessage: 'Remove connections',
          })}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        />
      )}
    </>
  );
};
