/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceDetail, WorkspaceDetailProps } from './workspace_detail/workspace_detail';
import { WorkspaceFormProvider } from './workspace_form';
import {
  WorkspaceFormSubmitData,
  WorkspaceOperationType,
  convertPermissionSettingsToPermissions,
  convertPermissionsToPermissionSettings,
} from './workspace_form';
import { DataSourceConnectionType } from '../../common/types';
import { WorkspaceClient } from '../workspace_client';
import { getDataSourcesList, mergeDataSourcesWithConnections } from '../utils';
import { WorkspaceAttributeWithPermission } from '../../../../core/types';

function getFormDataFromWorkspace(
  currentWorkspace: WorkspaceAttributeWithPermission | null | undefined
) {
  if (!currentWorkspace) {
    return null;
  }
  return {
    ...currentWorkspace,
    features: currentWorkspace.features ?? [],
    permissionSettings: currentWorkspace.permissions
      ? convertPermissionsToPermissionSettings(currentWorkspace.permissions)
      : currentWorkspace.permissions,
  };
}

export interface WorkspaceDetailPropsWithOnAppLeave extends WorkspaceDetailProps {
  onAppLeave: AppMountParameters['onAppLeave'];
}

export const WorkspaceDetailApp = (props: WorkspaceDetailPropsWithOnAppLeave) => {
  const {
    services: {
      workspaces,
      chrome,
      application,
      savedObjects,
      notifications,
      workspaceClient,
      http,
    },
  } = useOpenSearchDashboards<{ CoreStart: CoreStart; workspaceClient: WorkspaceClient }>();
  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState<
    WorkspaceFormSubmitData
  >();
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const availableUseCases = useObservable(props.registeredUseCases$, []);
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text: i18n.translate('workspace.detail.title', {
          defaultMessage: 'Workspace details',
        }),
      },
    ]);
  }, [chrome]);

  useEffect(() => {
    const rawFormData = getFormDataFromWorkspace(currentWorkspace);

    if (rawFormData && savedObjects && currentWorkspace) {
      getDataSourcesList(savedObjects.client, [currentWorkspace.id]).then((dataSources) => {
        setCurrentWorkspaceFormData({
          ...rawFormData,
          // Direct query connections info is not required for all tabs, it can be fetched later
          selectedDataSourceConnections: mergeDataSourcesWithConnections(dataSources, []),
        });
      });
    }
  }, [currentWorkspace, savedObjects, http, notifications]);

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      if (isFormSubmitting) {
        return;
      }
      if (!currentWorkspace) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.detail.notFoundError', {
            defaultMessage: 'Cannot update workspace',
          }),
        });
        return;
      }
      setIsFormSubmitting(true);

      try {
        const { permissionSettings, selectedDataSourceConnections, ...attributes } = data;
        const selectedDataSourceIds = (selectedDataSourceConnections ?? [])
          .filter(
            ({ connectionType }) => connectionType === DataSourceConnectionType.OpenSearchConnection
          )
          .map((connection) => {
            return connection.id;
          });

        result = await workspaceClient.update(currentWorkspace.id, attributes, {
          dataSources: selectedDataSourceIds,
          // If user updates workspace when permission is disabled, the permission settings will be cleared
          ...(isPermissionEnabled
            ? {
                permissions: convertPermissionSettingsToPermissions(permissionSettings),
              }
            : {}),
        });
        setIsFormSubmitting(false);
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.update.success', {
              defaultMessage: 'Update workspace successfully',
            }),
          });
          return result;
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
        setIsFormSubmitting(false);
        return;
      }
    },
    [
      isFormSubmitting,
      currentWorkspace,
      notifications?.toasts,
      workspaceClient,
      isPermissionEnabled,
    ]
  );

  if (!workspaces || !application || !http || !savedObjects || !currentWorkspaceFormData) {
    return null;
  }

  return (
    <WorkspaceFormProvider
      application={application}
      savedObjects={savedObjects}
      operationType={WorkspaceOperationType.Update}
      permissionEnabled={isPermissionEnabled}
      onSubmit={handleWorkspaceFormSubmit}
      defaultValues={currentWorkspaceFormData}
      availableUseCases={availableUseCases}
      onAppLeave={props.onAppLeave}
    >
      <I18nProvider>
        <WorkspaceDetail {...props} isFormSubmitting={isFormSubmitting} />
      </I18nProvider>
    </WorkspaceFormProvider>
  );
};
