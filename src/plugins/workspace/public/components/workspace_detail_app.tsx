/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { EuiBreadcrumb } from '@elastic/eui';
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
import { formatUrlWithWorkspaceId } from '../../../../core/public/utils';
import { WORKSPACE_DETAIL_APP_ID } from '../../common/constants';
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

export const WorkspaceDetailApp = (props: WorkspaceDetailProps) => {
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

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    const breadcrumbs: EuiBreadcrumb[] = [
      {
        text: 'Home',
        onClick: () => {
          application?.navigateToApp('home');
        },
      },
    ];
    if (currentWorkspace) {
      breadcrumbs.push({
        text: currentWorkspace.name,
      });
      breadcrumbs.push({
        text: i18n.translate('workspace.detail.title', {
          defaultMessage: '{name} settings',
          values: {
            name: currentWorkspace.name,
          },
        }),
      });
    }
    chrome?.setBreadcrumbs(breadcrumbs);
  }, [chrome, currentWorkspace, application]);

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
      if (!currentWorkspace) {
        notifications?.toasts.addDanger({
          title: i18n.translate('Cannot find current workspace', {
            defaultMessage: 'Cannot update workspace',
          }),
        });
        return;
      }

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
          permissions: convertPermissionSettingsToPermissions(permissionSettings),
        });
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
                application.getUrlForApp(WORKSPACE_DETAIL_APP_ID, {
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
    >
      <I18nProvider>
        <WorkspaceDetail {...props} />
      </I18nProvider>
    </WorkspaceFormProvider>
  );
};
