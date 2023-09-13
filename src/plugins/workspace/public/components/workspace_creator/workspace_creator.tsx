/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceForm, WorkspaceFormSubmitData } from './workspace_form';
import { WORKSPACE_OVERVIEW_APP_ID, WORKSPACE_OP_TYPE_CREATE } from '../../../common/constants';
import { formatUrlWithWorkspaceId } from '../../utils';
import { WorkspaceClient } from '../../workspace_client';

export const WorkspaceCreator = () => {
  const {
    services: { application, notifications, http, workspaceClient },
  } = useOpenSearchDashboards<{ workspaceClient: WorkspaceClient }>();

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormSubmitData) => {
      let result;
      try {
        result = await workspaceClient.create(data);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.create.failed', {
            defaultMessage: 'Failed to create workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.create.success', {
            defaultMessage: 'Create workspace successfully',
          }),
        });
        if (application && http) {
          window.location.href = formatUrlWithWorkspaceId(
            application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
              absolute: true,
            }),
            result.result.id,
            http.basePath
          );
        }
        return;
      }
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.create.failed', {
          defaultMessage: 'Failed to create workspace',
        }),
        text: result?.error,
      });
    },
    [notifications?.toasts, http, application, workspaceClient]
  );

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody panelled>
        <EuiPageHeader restrictWidth pageTitle="Create Workspace" />
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
              onSubmit={handleWorkspaceFormSubmit}
              opType={WORKSPACE_OP_TYPE_CREATE}
              permissionFirstRowDeletable
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
