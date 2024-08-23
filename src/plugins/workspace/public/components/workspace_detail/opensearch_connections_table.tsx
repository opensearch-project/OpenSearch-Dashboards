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
import { CoreStart, WorkspaceObject } from '../../../../../core/public';
import { DataSource } from '../../../common/types';
import { WorkspaceClient } from '../../workspace_client';
import { convertPermissionSettingsToPermissions, useWorkspaceFormContext } from '../workspace_form';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

interface OpenSearchConnectionTableProps {
  assignedDataSources: DataSource[];
  isDashboardAdmin: boolean;
  currentWorkspace: WorkspaceObject;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const OpenSearchConnectionTable = ({
  assignedDataSources,
  isDashboardAdmin,
  currentWorkspace,
  setIsLoading,
}: OpenSearchConnectionTableProps) => {
  const {
    services: { notifications, workspaceClient },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();
  const { formData, setSelectedDataSources } = useWorkspaceFormContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<DataSource[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredDataSources = useMemo(
    () =>
      assignedDataSources.filter((dataSource) =>
        dataSource.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, assignedDataSources]
  );

  const onSelectionChange = (selectedDataSources: DataSource[]) => {
    setSelectedItems(selectedDataSources);
  };

  const handleUnassignDataSources = async (dataSources: DataSource[]) => {
    try {
      setIsLoading(true);
      setModalVisible(false);
      const { permissionSettings, selectedDataSources, useCase, ...attributes } = formData;
      const savedDataSources = (selectedDataSources ?? [])?.filter(
        ({ id }: DataSource) => !dataSources.some((item) => item.id === id)
      );

      const result = await workspaceClient.update(currentWorkspace.id, attributes, {
        dataSources: savedDataSources.map(({ id }: DataSource) => id),
        permissions: convertPermissionSettingsToPermissions(permissionSettings),
      });
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.detail.dataSources.unassign.success', {
            defaultMessage: 'Remove associated OpenSearch connections successfully',
          }),
        });
        setSelectedDataSources(savedDataSources);
      } else {
        throw new Error(
          result?.error ? result?.error : 'Remove associated OpenSearch connections failed'
        );
      }
    } catch (error) {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.detail.dataSources.unassign.failed', {
          defaultMessage: 'Failed to remove associated OpenSearch connections',
        }),
        text: error instanceof Error ? error.message : JSON.stringify(error),
      });
    } finally {
      setIsLoading(false);
    }
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
                  setSelectedItems([item]);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        {selectedItems.length > 0 && !modalVisible && (
          <EuiFlexItem grow={false}>
            <EuiButton
              color="danger"
              onClick={() => setModalVisible(true)}
              data-test-subj="workspace-detail-dataSources-table-bulkRemove"
            >
              {i18n.translate('workspace.detail.dataSources.table.remove.button', {
                defaultMessage: 'Remove {numberOfSelect} association(s)',
                values: { numberOfSelect: selectedItems.length },
              })}
            </EuiButton>
          </EuiFlexItem>
        )}
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search"
            value={searchTerm}
            onChange={handleSearch}
            isClearable={true}
            fullWidth
            aria-label="Search data sources"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
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
            setSelectedItems([]);
          }}
          onConfirm={() => {
            handleUnassignDataSources(selectedItems);
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
