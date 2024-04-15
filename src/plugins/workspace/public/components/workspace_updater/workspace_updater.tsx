/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WorkspaceAttribute } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceFormSubmitData, WorkspaceOperationType } from '../workspace_form';
import { WORKSPACE_OVERVIEW_APP_ID } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { WorkspaceClient } from '../../workspace_client';
import { WorkspaceFormData } from '../workspace_form/types';

function getFormDataFromWorkspace(
  currentWorkspace: WorkspaceAttribute | null | undefined
): WorkspaceFormData {
  return (currentWorkspace || {}) as WorkspaceFormData;
}

export const WorkspaceUpdater = () => {
  const {
    services: { application, workspaces, notifications, http, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));
  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState<WorkspaceFormData>(
    getFormDataFromWorkspace(currentWorkspace)
  );

  useEffect(() => {
    setCurrentWorkspaceFormData(getFormDataFromWorkspace(currentWorkspace));
  }, [currentWorkspace]);

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
        const { ...attributes } = data;
        result = await workspaceClient.update(currentWorkspace.id, attributes);
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

  if (!currentWorkspaceFormData.name) {
    return null;
  }

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader restrictWidth pageTitle="Update Workspace" />
        <EuiPageContent
          verticalPosition="center"
          horizontalPosition="center"
          paddingSize="none"
          color="subdued"
          hasShadow={false}
          style={{ width: '100%', maxWidth: 1000 }}
        >
          {application && (
            <WorkspaceForm
              application={application}
              defaultValues={currentWorkspaceFormData}
              onSubmit={handleWorkspaceFormSubmit}
              operationType={WorkspaceOperationType.Update}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
