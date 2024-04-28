/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PublicAppInfo } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WORKSPACE_OVERVIEW_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceAttributeWithPermission } from '../../../../../core/types';
import { WorkspaceClient } from '../../workspace_client';
import {
  WorkspaceForm,
  WorkspaceFormSubmitData,
  WorkspaceOperationType,
  convertPermissionsToPermissionSettings,
  convertPermissionSettingsToPermissions,
} from '../workspace_form';

export interface WorkspaceUpdaterProps {
  workspaceConfigurableApps$?: BehaviorSubject<PublicAppInfo[]>;
  hideTitle?: boolean;
  maxWidth?: number | string;
}

function getFormDataFromWorkspace(
  currentWorkspace: WorkspaceAttributeWithPermission | null | undefined
) {
  if (!currentWorkspace) {
    return null;
  }
  return {
    ...currentWorkspace,
    permissionSettings: currentWorkspace.permissions
      ? convertPermissionsToPermissionSettings(currentWorkspace.permissions)
      : currentWorkspace.permissions,
  };
}

export const WorkspaceUpdater = (props: WorkspaceUpdaterProps) => {
  const {
    services: { application, workspaces, notifications, http, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const workspaceConfigurableApps = useObservable(
    props.workspaceConfigurableApps$ ?? of(undefined)
  );
  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState(
    getFormDataFromWorkspace(currentWorkspace)
  );

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      if (!currentWorkspace) {
        notifications?.toasts.addDanger({
          title: i18n.translate('Cannot find current workspace', {
            defaultMessage: 'Cannot update workspace',
          }),
        });
        return;
      }

      try {
        const { permissionSettings, ...attributes } = data;
        result = await workspaceClient.update(
          currentWorkspace.id,
          attributes,
          convertPermissionSettingsToPermissions(permissionSettings)
        );
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.update.success', {
              defaultMessage: 'Update workspace successfully',
            }),
          });
          if (application && http) {
            // Redirect page after one second, leave one second time to show update successful toast.
            window.setTimeout(() => {
              window.location.href = formatUrlWithWorkspaceId(
                application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
                  absolute: true,
                }),
                currentWorkspace.id,
                http.basePath
              );
            }, 1000);
          }
          return;
        } else {
          throw new Error(result?.error ? result?.error : 'update workspace failed');
        }
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.update.failed', {
            defaultMessage: 'Failed to update workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
    },
    [notifications?.toasts, currentWorkspace, http, application, workspaceClient]
  );

  useEffect(() => {
    setCurrentWorkspaceFormData(getFormDataFromWorkspace(currentWorkspace));
  }, [currentWorkspace]);

  if (!currentWorkspaceFormData) {
    return null;
  }

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody>
        {!props.hideTitle ? <EuiPageHeader restrictWidth pageTitle="Update Workspace" /> : null}
        <EuiSpacer />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: props.maxWidth ? props.maxWidth : 1000 }}
        >
          {application && (
            <WorkspaceForm
              application={application}
              defaultValues={currentWorkspaceFormData}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Update}
              workspaceConfigurableApps={workspaceConfigurableApps}
              permissionEnabled={isPermissionEnabled}
              permissionLastAdminItemDeletable={false}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
