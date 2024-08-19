/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from 'react-intl';
import { DataSource } from '../../../common/types';
import { WorkspaceClient } from '../../workspace_client';
import { OpenSearchConnectionTable } from './opensearch_connections_table';
import { AssociationDataSourceModal } from './association_data_source_modal';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart, SavedObjectsStart, WorkspaceObject } from '../../../../../core/public';
import { convertPermissionSettingsToPermissions, useWorkspaceFormContext } from '../workspace_form';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleAssignDataSources = async (dataSources: DataSource[]) => {
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

  const associationButton = (
    <EuiSmallButton
      onClick={() => setIsVisible(true)}
      isLoading={isLoading}
      data-test-subj="workspace-detail-dataSources-assign-button"
    >
      {i18n.translate('workspace.detail.dataSources.assign.button', {
        defaultMessage: 'Association OpenSearch Connections',
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
          defaultMessage="Loading OpenSearch connections..."
        />
      </EuiText>
    </div>
  );

  const noAssociationMessage = (
    <EuiTextAlign textAlign="center">
      <EuiTitle>
        <h3>
          <FormattedMessage
            id="workspace.detail.dataSources.noAssociation.title"
            defaultMessage="No associated data sources"
          />
        </h3>
      </EuiTitle>
      <EuiSpacer />
      <EuiText color="subdued">
        <FormattedMessage
          id="workspace.detail.dataSources.noAssociation.message"
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
        currentWorkspace={currentWorkspace}
        assignedDataSources={assignedDataSources}
        setIsLoading={setIsLoading}
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
        {isDashboardAdmin && <EuiFlexItem grow={false}>{associationButton}</EuiFlexItem>}
      </EuiFlexGroup>
      <EuiHorizontalRule />
      {renderTableContent()}
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
