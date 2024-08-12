/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  euiPaletteColorBlind,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject } from 'rxjs';

import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceFormSubmitData, WorkspaceOperationType } from '../workspace_form';
import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { convertPermissionSettingsToPermissions } from '../workspace_form';
import { DataSource } from '../../../common/types';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { WorkspaceUseCase } from '../../types';
import { WorkspaceFormData } from '../workspace_form/types';

export interface WorkspaceCreatorProps {
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceCreator = (props: WorkspaceCreatorProps) => {
  const {
    services: {
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

  const defaultWorkspaceFormValues: Partial<WorkspaceFormData> = {
    color: euiPaletteColorBlind()[0],
  };

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
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader pageTitle="Create a workspace" />
        <EuiPageContent
          verticalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
        >
          {application && savedObjects && (
            <WorkspaceForm
              application={application}
              savedObjects={savedObjects}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Create}
              permissionEnabled={isPermissionEnabled}
              dataSourceManagement={dataSourceManagement}
              availableUseCases={availableUseCases}
              defaultValues={defaultWorkspaceFormValues}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
