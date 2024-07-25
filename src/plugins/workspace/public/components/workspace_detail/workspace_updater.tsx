/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiPage, EuiPageBody, EuiPageContent, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceAttributeWithPermission } from '../../../../../core/types';
import { WorkspaceClient } from '../../workspace_client';
import {
  WorkspaceFormSubmitData,
  WorkspaceOperationType,
  convertPermissionsToPermissionSettings,
  convertPermissionSettingsToPermissions,
  WorkspaceDetailForm,
} from '../workspace_form';
import { getDataSourcesList } from '../../utils';
import { DataSource } from '../../../common/types';
import { DetailTab } from '../workspace_form/constants';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';

export interface WorkspaceUpdaterProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
  detailTab?: DetailTab;
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

type FormDataFromWorkspace = ReturnType<typeof getFormDataFromWorkspace> & {
  selectedDataSources: DataSource[];
};

export const WorkspaceUpdater = (props: WorkspaceUpdaterProps) => {
  const {
    services: {
      application,
      workspaces,
      notifications,
      http,
      workspaceClient,
      savedObjects,
      dataSourceManagement,
    },
  } = useOpenSearchDashboards<{
    workspaceClient: WorkspaceClient;
    dataSourceManagement?: DataSourceManagementPluginSetup;
  }>();

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const availableUseCases = useObservable(props.registeredUseCases$, []);
  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState<FormDataFromWorkspace>();

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
        const { permissionSettings, selectedDataSources, ...attributes } = data;
        const selectedDataSourceIds = (selectedDataSources ?? []).map((ds: DataSource) => {
          return ds.id;
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

  useEffect(() => {
    const rawFormData = getFormDataFromWorkspace(currentWorkspace);

    if (rawFormData && savedObjects && currentWorkspace) {
      getDataSourcesList(savedObjects.client, [currentWorkspace.id]).then((selectedDataSources) => {
        setCurrentWorkspaceFormData({
          ...rawFormData,
          selectedDataSources,
        });
      });
    }
  }, [currentWorkspace, savedObjects]);

  if (!currentWorkspaceFormData) {
    return null;
  }

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiSpacer />
        <EuiPageContent
          verticalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: '100%' }}
        >
          {application && savedObjects && (
            <WorkspaceDetailForm
              application={application}
              defaultValues={currentWorkspaceFormData}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Update}
              savedObjects={savedObjects}
              permissionEnabled={isPermissionEnabled}
              detailTab={props.detailTab}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
