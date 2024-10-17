/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPage, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { CoreStart } from '../../../../../core/public';
import {
  NavigationPublicPluginStart,
  TopNavControlDescriptionData,
} from '../../../../navigation/public';
import { WorkspacePermissionSetting } from '../workspace_form/types';
import { WorkspaceCollaboratorTable } from '../workspace_form/workspace_collaborator_table';
import { WorkspaceCollaboratorTypesService } from '../../services/workspace_collaborator_types_service';
import { AddCollaboratorButton } from '../workspace_form/add_collaborator_button';
import {
  convertPermissionSettingsToPermissions,
  convertPermissionsToPermissionSettings,
} from '../workspace_form';
import { WorkspaceAttributeWithPermission } from '../../../../../core/types';
import { WorkspaceClient } from '../../workspace_client';

export const WorkspaceCollaborators = () => {
  const {
    services: {
      workspaces,
      application,
      navigationUI: { HeaderControl },
      workspaceClient,
      collaboratorTypes,
      notifications,
    },
  } = useOpenSearchDashboards<{
    CoreStart: CoreStart;
    navigationUI: NavigationPublicPluginStart['ui'];
    collaboratorTypes: WorkspaceCollaboratorTypesService;
    workspaceClient: WorkspaceClient;
  }>();

  const displayedCollaboratorTypes = useObservable(collaboratorTypes.getTypes$()) ?? [];

  const currentWorkspace = useObservable(
    workspaces ? workspaces.currentWorkspace$ : of(null)
  ) as WorkspaceAttributeWithPermission;

  const permissionSettings = convertPermissionsToPermissionSettings(
    currentWorkspace?.permissions ?? {}
  );

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  const handleSubmitPermissionSettings = async (settings: WorkspacePermissionSetting[]) => {
    const showErrorNotification = (errorText?: string) => {
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.collaborators.update.failed.message', {
          defaultMessage: 'Failed to update workspace collaborators',
        }),
        ...(errorText ? { text: errorText } : {}),
      });
    };

    try {
      const result = await workspaceClient.update(
        currentWorkspace.id,
        {},
        {
          permissions: convertPermissionSettingsToPermissions(settings),
        }
      );

      if (!result.success) {
        showErrorNotification(result.error);
      }
      return result;
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : JSON.stringify(error));
      return {
        success: false as const,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      };
    }
  };

  if (!currentWorkspace || !isPermissionEnabled) {
    return null;
  }
  return (
    <EuiPage data-test-subj="workspace-collaborators-panel">
      <HeaderControl
        controls={[
          {
            description: i18n.translate('workspace.collaborators.description', {
              defaultMessage: 'Manage workspace access and permissions.',
            }),
          } as TopNavControlDescriptionData,
        ]}
        setMountPoint={application.setAppDescriptionControls}
      />
      <HeaderControl
        controls={[
          {
            renderComponent: (
              <AddCollaboratorButton
                permissionSettings={permissionSettings}
                displayedTypes={displayedCollaboratorTypes}
                handleSubmitPermissionSettings={handleSubmitPermissionSettings}
              />
            ),
          },
        ]}
        setMountPoint={application?.setAppRightControls}
      />
      <EuiPanel>
        <WorkspaceCollaboratorTable
          permissionSettings={permissionSettings}
          displayedCollaboratorTypes={displayedCollaboratorTypes}
          handleSubmitPermissionSettings={handleSubmitPermissionSettings}
        />
      </EuiPanel>
    </EuiPage>
  );
};
