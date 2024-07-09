/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import { BehaviorSubject, of } from 'rxjs';

import { PublicAppInfo } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceFormSubmitData, WorkspaceOperationType } from '../workspace_form';
import { WORKSPACE_OVERVIEW_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { convertPermissionSettingsToPermissions } from '../workspace_form';
import { DataSource } from '../../../common/types';
import { WorkspaceUseCase } from '../../types';

export interface WorkspaceCreatorProps {
  workspaceConfigurableApps$?: BehaviorSubject<PublicAppInfo[]>;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const WorkspaceCreator = (props: WorkspaceCreatorProps) => {
  const {
    services: { application, notifications, http, workspaceClient, savedObjects },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();
  const workspaceConfigurableApps = useObservable(
    props.workspaceConfigurableApps$ ?? of(undefined)
  );
  const isPermissionEnabled = application?.capabilities.workspaces.permissionEnabled;
  const availableUseCases = useObservable(props.registeredUseCases$);

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
                application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
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
    <EuiPage paddingSize="none">
      <EuiPageBody>
        <EuiPageHeader restrictWidth pageTitle="Create a workspace" />
        <EuiSpacer />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          /**
           * Since above EuiPageHeader has a maxWidth: 1000 style,
           * add maxWidth: 1000 below to align with the above page header
           **/
          style={{ width: '100%', maxWidth: 1000 }}
        >
          {application && savedObjects && (
            <WorkspaceForm
              application={application}
              savedObjects={savedObjects}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Create}
              workspaceConfigurableApps={workspaceConfigurableApps}
              permissionEnabled={isPermissionEnabled}
              permissionLastAdminItemDeletable
              availableUseCases={availableUseCases}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
