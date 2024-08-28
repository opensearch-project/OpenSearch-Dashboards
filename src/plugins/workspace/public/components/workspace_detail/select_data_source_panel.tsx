/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiText,
  EuiTitle,
  EuiPanel,
  EuiSpacer,
  EuiFlexItem,
  EuiTextAlign,
  EuiFlexGroup,
  EuiSmallButton,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiButtonGroup,
  EuiIcon,
  EuiButtonGroupOptionProps,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { DataSource, DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { WorkspaceClient } from '../../workspace_client';
import { OpenSearchConnectionTable } from './opensearch_connections_table';
import { AssociationDataSourceModal } from './association_data_source_modal';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart, SavedObjectsStart, WorkspaceObject } from '../../../../../core/public';
import { convertPermissionSettingsToPermissions, useWorkspaceFormContext } from '../workspace_form';
import { fetchDataSourceConnections } from '../../utils';
import { AssociationDataSourceModalTab } from '../../../common/constants';

const toggleButtons: EuiButtonGroupOptionProps[] = [
  {
    id: AssociationDataSourceModalTab.OpenSearchConnections,
    label: i18n.translate('workspace.detail.dataSources.openSearchConnections', {
      defaultMessage: 'OpenSearch connections',
    }),
  },
  {
    id: AssociationDataSourceModalTab.DirectQueryConnections,
    label: i18n.translate('workspace.detail.dataSources.directQueryConnections', {
      defaultMessage: 'Direct query connections',
    }),
  },
];
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
    services: { notifications, workspaceClient, http },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();
  const { formData, setSelectedDataSources } = useWorkspaceFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [assignedDataSourceConnections, setAssignedDataSourceConnections] = useState<
    DataSourceConnection[]
  >([]);
  const [toggleIdSelected, setToggleIdSelected] = useState(toggleButtons[0].id);

  useEffect(() => {
    setIsLoading(true);
    fetchDataSourceConnections(assignedDataSources, http, notifications).then((connections) => {
      setAssignedDataSourceConnections(connections);
      setIsLoading(false);
    });
  }, [assignedDataSources, http, notifications]);

  const handleAssignDataSourceConnections = async (
    dataSourceConnections: DataSourceConnection[]
  ) => {
    const dataSources = dataSourceConnections
      .filter(
        ({ connectionType }) => connectionType === DataSourceConnectionType.OpenSearchConnection
      )
      .map(({ id, type, name, description }) => ({
        id,
        title: name,
        description,
        dataSourceEngineType: type,
      }));
    try {
      setIsLoading(true);
      setIsVisible(false);
      const { permissionSettings, selectedDataSources, useCase, ...attributes } = formData;
      const savedDataSources: DataSource[] = [...selectedDataSources, ...dataSources];

      const result = await workspaceClient.update(currentWorkspace.id, attributes, {
        dataSources: savedDataSources.map((ds) => {
          return ds.id;
        }),
        permissions: convertPermissionSettingsToPermissions(permissionSettings),
      });
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.detail.dataSources.assign.success', {
            defaultMessage: 'Associate OpenSearch connections successfully',
          }),
        });
        setSelectedDataSources(savedDataSources);
      } else {
        throw new Error(result?.error ? result?.error : 'Associate OpenSearch connections failed');
      }
    } catch (error) {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.detail.dataSources.assign.failed', {
          defaultMessage: 'Failed to associate OpenSearch connections',
        }),
        text: error instanceof Error ? error.message : JSON.stringify(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignDataSources = useCallback(
    async (dataSources: DataSourceConnection[]) => {
      try {
        setIsLoading(true);
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
    },
    [currentWorkspace.id, formData, notifications?.toasts, setSelectedDataSources, workspaceClient]
  );

  const associationButton = (
    <EuiSmallButton
      onClick={() => setIsVisible(true)}
      isLoading={isLoading}
      data-test-subj="workspace-detail-dataSources-assign-button"
    >
      {i18n.translate('workspace.detail.dataSources.assign.button', {
        defaultMessage: 'Associate data sources',
      })}
    </EuiSmallButton>
  );

  const loadingMessage = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <EuiLoadingSpinner size="xl" />
      <EuiSpacer size="m" />
      <EuiText>
        <FormattedMessage
          id="workspace.detail.dataSources.noAssociation.message"
          defaultMessage="Loading data sources..."
        />
      </EuiText>
    </div>
  );

  const noAssociationMessage = (
    <EuiTextAlign textAlign="center">
      <EuiIcon type="unlink" size="xl" />
      <EuiSpacer />
      <EuiTitle>
        <h3>
          <FormattedMessage
            id="workspace.detail.dataSources.noAssociation.title"
            defaultMessage="No data sources to display"
          />
        </h3>
      </EuiTitle>
      <EuiSpacer />
      <EuiText color="subdued">
        <FormattedMessage
          id="workspace.detail.dataSources.noAssociation.message"
          defaultMessage="There are no data sources associated with the workspace."
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
            id="workspace.detail.dataSources.noAssociation.noAdmin.message"
            defaultMessage="Contact your administrator to associate data sources with the workspace."
          />
        </EuiText>
      )}
    </EuiTextAlign>
  );

  const renderTableContent = () => {
    if (isLoading) {
      return loadingMessage;
    }
    if (assignedDataSources.length === 0) {
      return noAssociationMessage;
    }
    return (
      <OpenSearchConnectionTable
        isDashboardAdmin={isDashboardAdmin}
        connectionType={toggleIdSelected}
        dataSourceConnections={assignedDataSourceConnections}
        handleUnassignDataSources={handleUnassignDataSources}
      />
    );
  };

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h2>{detailTitle}</h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem>
              <EuiButtonGroup
                legend="dataSourceGroup"
                options={toggleButtons}
                idSelected={toggleIdSelected}
                onChange={(id) => setToggleIdSelected(id)}
              />
            </EuiFlexItem>
            {isDashboardAdmin && <EuiFlexItem grow={false}>{associationButton}</EuiFlexItem>}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiHorizontalRule />
      {renderTableContent()}
      {isVisible && (
        <AssociationDataSourceModal
          http={http}
          notifications={notifications}
          savedObjects={savedObjects}
          closeModal={() => setIsVisible(false)}
          assignedConnections={assignedDataSourceConnections}
          handleAssignDataSourceConnections={handleAssignDataSourceConnections}
        />
      )}
    </EuiPanel>
  );
};
