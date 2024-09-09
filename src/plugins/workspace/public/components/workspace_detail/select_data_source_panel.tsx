/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
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
import { useUpdateEffect } from 'react-use';
import { DataSourceConnection, DataSourceConnectionType } from '../../../common/types';
import { WorkspaceClient } from '../../workspace_client';
import { WorkspaceDetailConnectionTable } from './workspace_detail_connection_table';
import { AssociationDataSourceModal } from './association_data_source_modal';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  CoreStart,
  SavedObjectsStart,
  WorkspaceObject,
  ChromeStart,
} from '../../../../../core/public';
import {
  convertPermissionSettingsToPermissions,
  isWorkspacePermissionSetting,
  useWorkspaceFormContext,
} from '../workspace_form';
import { AssociationDataSourceModalMode } from '../../../common/constants';

const toggleButtons: EuiButtonGroupOptionProps[] = [
  {
    id: AssociationDataSourceModalMode.OpenSearchConnections,
    label: i18n.translate('workspace.detail.dataSources.openSearchConnections', {
      defaultMessage: 'OpenSearch connections',
    }),
  },
  {
    id: AssociationDataSourceModalMode.DirectQueryConnections,
    label: i18n.translate('workspace.detail.dataSources.directQueryConnections', {
      defaultMessage: 'Direct query connections',
    }),
  },
];
export interface SelectDataSourceDetailPanelProps {
  savedObjects: SavedObjectsStart;
  detailTitle: string;
  isDashboardAdmin: boolean;
  currentWorkspace: WorkspaceObject;
  chrome: ChromeStart;
  loading?: boolean;
}

export const SelectDataSourceDetailPanel = ({
  savedObjects,
  detailTitle,
  isDashboardAdmin,
  currentWorkspace,
  chrome,
  loading = false,
}: SelectDataSourceDetailPanelProps) => {
  const {
    services: { notifications, workspaceClient, http },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();
  const { formData, setSelectedDataSourceConnections } = useWorkspaceFormContext();
  const [isLoading, setIsLoading] = useState(loading);
  const [isVisible, setIsVisible] = useState(false);
  const [toggleIdSelected, setToggleIdSelected] = useState(toggleButtons[0].id);

  const handleAssignDataSourceConnections = async (
    newAssignedDataSourceConnections: DataSourceConnection[]
  ) => {
    try {
      setIsLoading(true);
      setIsVisible(false);
      const {
        permissionSettings,
        selectedDataSourceConnections,
        useCase,
        ...attributes
      } = formData;

      const savedDataSourceConnections = [
        ...formData.selectedDataSourceConnections,
        ...newAssignedDataSourceConnections,
      ];

      const result = await workspaceClient.update(currentWorkspace.id, attributes, {
        dataSources: savedDataSourceConnections
          .filter(
            ({ connectionType }) => connectionType === DataSourceConnectionType.OpenSearchConnection
          )
          .map(({ id }) => id),
        // Todo: Make permissions be an optional parameter when update workspace
        permissions: convertPermissionSettingsToPermissions(
          permissionSettings.filter(isWorkspacePermissionSetting)
        ),
      });
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.detail.dataSources.assign.success', {
            defaultMessage: 'Associate OpenSearch connections successfully',
          }),
        });
        setSelectedDataSourceConnections(savedDataSourceConnections);
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
    async (unAssignedDataSources: DataSourceConnection[]) => {
      try {
        setIsLoading(true);
        const {
          permissionSettings,
          selectedDataSourceConnections,
          useCase,
          ...attributes
        } = formData;
        const savedDataSourceConnections = selectedDataSourceConnections.filter(
          ({ id }) => !unAssignedDataSources.some((item) => item.id === id)
        );

        const result = await workspaceClient.update(currentWorkspace.id, attributes, {
          dataSources: savedDataSourceConnections
            .filter(
              ({ connectionType }) =>
                connectionType === DataSourceConnectionType.OpenSearchConnection
            )
            .map(({ id }) => id),
          // Todo: Make permissions be an optional parameter when update workspace
          permissions: convertPermissionSettingsToPermissions(
            permissionSettings.filter(isWorkspacePermissionSetting)
          ),
        });
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.detail.dataSources.unassign.success', {
              defaultMessage: 'Remove associated OpenSearch connections successfully',
            }),
          });
          setSelectedDataSourceConnections(savedDataSourceConnections);
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
    [
      currentWorkspace.id,
      formData,
      notifications?.toasts,
      setSelectedDataSourceConnections,
      workspaceClient,
    ]
  );

  const associationButton = (
    <EuiSmallButton
      onClick={() => setIsVisible(true)}
      isLoading={isLoading}
      data-test-subj="workspace-detail-dataSources-assign-button"
    >
      {toggleIdSelected === AssociationDataSourceModalMode.OpenSearchConnections
        ? i18n.translate('workspace.detail.dataSources.opensearchConnections.assign.button', {
            defaultMessage: 'Associate OpenSearch connections',
          })
        : i18n.translate('workspace.detail.dataSources.directQueryConnections.assign.button', {
            defaultMessage: 'Associate direct query connections',
          })}
    </EuiSmallButton>
  );

  const loadingMessage = (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <EuiLoadingSpinner size="xl" />
      <EuiSpacer size="m" />
      <EuiText>
        <FormattedMessage
          id="workspace.detail.dataSources.loading.message"
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
    if (formData.selectedDataSourceConnections.length === 0) {
      return noAssociationMessage;
    }
    return (
      <WorkspaceDetailConnectionTable
        isDashboardAdmin={isDashboardAdmin}
        connectionType={toggleIdSelected}
        dataSourceConnections={formData.selectedDataSourceConnections}
        handleUnassignDataSources={handleUnassignDataSources}
      />
    );
  };

  useUpdateEffect(() => {
    setIsLoading(loading);
  }, [loading]);

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
          assignedConnections={formData.selectedDataSourceConnections}
          handleAssignDataSourceConnections={handleAssignDataSourceConnections}
          mode={toggleIdSelected as AssociationDataSourceModalMode}
          logos={chrome.logos}
        />
      )}
    </EuiPanel>
  );
};
