/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  EuiText,
  EuiTitle,
  EuiPanel,
  EuiSpacer,
  EuiButton,
  EuiFlexItem,
  EuiTextAlign,
  EuiFlexGroup,
  EuiBasicTable,
  EuiSmallButton,
  EuiFieldSearch,
  EuiHorizontalRule,
  EuiBasicTableColumn,
  EuiTableSelectionType,
  EuiTableActionsColumnType,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { CoreStart, SavedObjectsStart, WorkspaceObject } from '../../../../../core/public';
import { DataSource } from '../../../common/types';
import { AssociationDataSourceModal } from './association_data_source_modal';
import { WorkspaceClient } from '../../workspace_client';
import { convertPermissionSettingsToPermissions, useWorkspaceFormContext } from '../workspace_form';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';

export interface SelectDataSourcePanelProps {
  savedObjects: SavedObjectsStart;
  assignedDataSources: DataSource[];
  detailTitle: string;
  isDashboardAdmin: boolean;
  currentWorkspace: WorkspaceObject;
}

export const SelectDataSourceDetailPanel = ({
  assignedDataSources,
  savedObjects,
  detailTitle,
  isDashboardAdmin,
  currentWorkspace,
}: SelectDataSourcePanelProps) => {
  const {
    services: { notifications, workspaceClient },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();
  const { formData, setSelectedDataSources } = useWorkspaceFormContext();
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [SelectedItems, setSelectedItems] = useState<DataSource[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredDataSources = useMemo(
    () =>
      assignedDataSources.filter((dataSource) =>
        dataSource.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, assignedDataSources]
  );

  const onSelectionChange = (selectedItems: DataSource[]) => {
    setSelectedItems(selectedItems);
  };

  const handleUnassignDataSources = async (dataSources: DataSource[]) => {
    let result;
    if (!currentWorkspace) {
      notifications?.toasts.addDanger({
        title: i18n.translate('Cannot find current workspace', {
          defaultMessage: 'Cannot assign data source',
        }),
      });
      return;
    }
    try {
      const { permissionSettings, selectedDataSources, useCase, ...attributes } = formData;
      const savedDataSources = (selectedDataSources ?? [])?.filter(
        ({ id }: DataSource) => !dataSources.some((item) => item.id === id)
      );

      result = await workspaceClient.update(currentWorkspace.id, attributes, {
        dataSources: savedDataSources.map(({ id }: DataSource) => id),
        permissions: convertPermissionSettingsToPermissions(permissionSettings),
      });
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.unassign.success', {
            defaultMessage: 'unassign data source successfully',
          }),
        });
        setSelectedDataSources(savedDataSources);
        return;
      } else {
        throw new Error(result?.error ? result?.error : 'unassign data source failed');
      }
    } catch (error) {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.unassign.failed', {
          defaultMessage: 'Failed to unassign data source',
        }),
        text: error instanceof Error ? error.message : JSON.stringify(error),
      });
      return;
    }
  };

  const handleAssignDataSources = async (dataSources: DataSource[]) => {
    let result;
    if (!currentWorkspace) {
      notifications?.toasts.addDanger({
        title: i18n.translate('Cannot find current workspace', {
          defaultMessage: 'Cannot assign data source',
        }),
      });
      return;
    }
    try {
      const { permissionSettings, selectedDataSources, useCase, ...attributes } = formData;
      const savedDataSources: DataSource[] = [...selectedDataSources, ...dataSources];

      result = await workspaceClient.update(currentWorkspace.id, attributes, {
        dataSources: savedDataSources.map((ds) => {
          return ds.id;
        }),
        permissions: convertPermissionSettingsToPermissions(permissionSettings),
      });
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.update.success', {
            defaultMessage: 'assign data source successfully',
          }),
        });
        setIsVisible(false);
        setSelectedDataSources(savedDataSources);
        return;
      } else {
        throw new Error(result?.error ? result?.error : 'assign data source failed');
      }
    } catch (error) {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.update.failed', {
          defaultMessage: 'Failed to assign data source',
        }),
        text: error instanceof Error ? error.message : JSON.stringify(error),
      });
      return;
    }
  };

  const columns: Array<EuiBasicTableColumn<DataSource>> = [
    {
      field: 'title',
      name: 'Title',
      truncateText: true,
    },
    {
      field: 'dataSourceEngineType',
      name: 'Type',
      truncateText: true,
    },
    {
      field: 'description',
      name: 'Description',
      truncateText: true,
    },
    ...(isDashboardAdmin
      ? [
          {
            name: 'Actions',
            actions: [
              {
                name: 'Remove association',
                isPrimary: true,
                description: 'Remove association',
                icon: 'unlink',
                type: 'icon',
                onClick: (item: DataSource) => {
                  handleUnassignDataSources([item]);
                },
                'data-test-subj': 'action-share',
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
    <EuiSmallButton onClick={() => setIsVisible(true)}>
      {i18n.translate('workspace.detail.delete', {
        defaultMessage: 'Association OpenSearch Connections',
      })}
    </EuiSmallButton>
  );

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h2>{detailTitle}</h2>
          </EuiTitle>
        </EuiFlexItem>
        {isDashboardAdmin && <EuiFlexItem grow={false}>{associationButton}</EuiFlexItem>}
      </EuiFlexGroup>
      <EuiHorizontalRule />
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        {SelectedItems.length > 0 && (
          <EuiFlexItem grow={false}>
            <EuiButton color="danger" onClick={() => handleUnassignDataSources(SelectedItems)}>
              {i18n.translate('workspace.detail.delete', {
                defaultMessage: 'Remove {numberOfSelect} association(s)',
                values: { numberOfSelect: SelectedItems.length },
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
      <EuiSpacer />

      {assignedDataSources.length > 0 ? (
        <EuiBasicTable
          items={filteredDataSources}
          itemId="id"
          columns={columns}
          selection={selection}
        />
      ) : (
        <EuiTextAlign textAlign="center">
          <EuiTitle>
            <h3>
              <FormattedMessage
                id="workspace.form.selectDataSource.title"
                defaultMessage="No associated data sources"
              />
            </h3>
          </EuiTitle>
          <EuiSpacer />
          <EuiText color="subdued">
            <FormattedMessage
              id="workspace.form.selectDataSource.title"
              defaultMessage="No OpenSearch connections are available in this workspace."
            />
          </EuiText>
          {isDashboardAdmin ? (
            <>
              <EuiSpacer />
              {associationButton}
            </>
          ) : (
            <EuiText color="subdued">
              <FormattedMessage
                id="workspace.form.selectDataSource.title"
                defaultMessage="Contact your administrator to associate data sources with the workspace."
              />
            </EuiText>
          )}
        </EuiTextAlign>
      )}
      {isVisible && (
        <AssociationDataSourceModal
          savedObjects={savedObjects}
          assignedDataSources={assignedDataSources}
          closeModal={() => setIsVisible(false)}
          handleAssignDataSources={handleAssignDataSources}
        />
      )}
    </EuiPanel>
  );
};
