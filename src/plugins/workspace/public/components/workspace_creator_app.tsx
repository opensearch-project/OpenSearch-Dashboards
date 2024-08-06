/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { WorkspaceCreator } from './workspace_creator';
import { WorkspaceCreatorProps } from './workspace_creator/workspace_creator';
import {
  WorkspaceFormProvider,
  WorkspaceFormSubmitData,
  WorkspaceOperationType,
  convertPermissionSettingsToPermissions,
} from './workspace_form';
import { WorkspaceClient } from '../workspace_client';
import { DataSource } from '../../common/types';
import { WORKSPACE_DETAIL_APP_ID } from '../../common/constants';
import { DataSourceManagementPluginSetup } from '../../../data_source_management/public';
import { formatUrlWithWorkspaceId } from '../../../../core/public/utils';

export const WorkspaceCreatorApp = (props: WorkspaceCreatorProps) => {
  const {
    services: {
      chrome,
      application,
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

  /**
   * set breadcrumbs to chrome
   */
  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text: i18n.translate('workspace.workspaceCreateTitle', {
          defaultMessage: 'Create a workspace',
        }),
      },
    ]);
  }, [chrome]);

  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const availableUseCases = useObservable(props.registeredUseCases$, []);

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      try {
        const { permissionSettings, selectedDataSources, ...attributes } = data;
        const selectedDataSourceIds = (selectedDataSources ?? []).map((ds: DataSource) => {
          return ds.id;
        });
        result = await workspaceClient.create(attributes, {
          dataSources: selectedDataSourceIds,
          permissions: convertPermissionSettingsToPermissions(permissionSettings),
        });
        if (result?.success) {
          notifications?.toasts.addSuccess({
            title: i18n.translate('workspace.create.success', {
              defaultMessage: 'Create workspace successfully',
            }),
          });
          if (application && http) {
            const newWorkspaceId = result.result.id;
            // Redirect page after one second, leave one second time to show create successful toast.
            window.setTimeout(() => {
              window.location.href = formatUrlWithWorkspaceId(
                application.getUrlForApp(WORKSPACE_DETAIL_APP_ID, {
                  absolute: true,
                }),
                newWorkspaceId,
                http.basePath
              );
            }, 1000);
          }
          return;
        } else {
          throw new Error(result?.error ? result?.error : 'create workspace failed');
        }
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.create.failed', {
            defaultMessage: 'Failed to create workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
    },
    [notifications?.toasts, http, application, workspaceClient]
  );

  return (
    application &&
    savedObjects && (
      <WorkspaceFormProvider
        application={application}
        savedObjects={savedObjects}
        onSubmit={handleWorkspaceFormSubmit}
        operationType={WorkspaceOperationType.Create}
        permissionEnabled={isPermissionEnabled}
        dataSourceManagement={dataSourceManagement}
        availableUseCases={availableUseCases}
      >
        <I18nProvider>
          <WorkspaceCreator {...props} />
        </I18nProvider>
      </WorkspaceFormProvider>
    )
  );
};
