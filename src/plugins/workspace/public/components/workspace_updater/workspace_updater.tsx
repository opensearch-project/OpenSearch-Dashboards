/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';
import { useObservable } from 'react-use';
import { i18n } from '@osd/i18n';
import { of } from 'rxjs';

import { WorkspaceAttribute } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

import { PATHS } from '../../../common/constants';
import { WorkspaceForm, WorkspaceFormData } from '../workspace_creator/workspace_form';
import {
  WORKSPACE_APP_ID,
  WORKSPACE_ID_IN_SESSION_STORAGE,
  WORKSPACE_OP_TYPE_UPDATE,
} from '../../../common/constants';
import { ApplicationStart } from '../../../../../core/public';

export const WorkspaceUpdater = () => {
  const {
    services: { application, workspaces, notifications },
  } = useOpenSearchDashboards<{ application: ApplicationStart }>();

  const currentWorkspace = useObservable(
    workspaces ? workspaces.client.currentWorkspace$ : of(null)
  );

  const excludedAttribute = 'id';
  const { [excludedAttribute]: removedProperty, ...otherAttributes } =
    currentWorkspace || ({} as WorkspaceAttribute);

  const [currentWorkspaceFormData, setCurrentWorkspaceFormData] = useState<
    Omit<WorkspaceAttribute, 'id'>
  >(otherAttributes);

  useEffect(() => {
    const { id, ...others } = currentWorkspace || ({} as WorkspaceAttribute);
    setCurrentWorkspaceFormData(others);
  }, [workspaces, currentWorkspace, excludedAttribute]);

  const handleWorkspaceFormSubmit = useCallback(
    async (data: WorkspaceFormData) => {
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
        result = await workspaces?.client.update(currentWorkspace?.id, data);
      } catch (error) {
        notifications?.toasts.addDanger({
          title: i18n.translate('workspace.update.failed', {
            defaultMessage: 'Failed to update workspace',
          }),
          text: error instanceof Error ? error.message : JSON.stringify(error),
        });
        return;
      }
      if (result?.success) {
        notifications?.toasts.addSuccess({
          title: i18n.translate('workspace.update.success', {
            defaultMessage: 'Update workspace successfully',
          }),
        });
        application.navigateToApp(WORKSPACE_APP_ID, {
          path: PATHS.overview + '?' + WORKSPACE_ID_IN_SESSION_STORAGE + '=' + currentWorkspace.id,
        });
        return;
      }
      notifications?.toasts.addDanger({
        title: i18n.translate('workspace.update.failed', {
          defaultMessage: 'Failed to update workspace',
        }),
        text: result?.error,
      });
    },
    [notifications?.toasts, workspaces?.client, currentWorkspace, application]
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
              onSubmit={handleWorkspaceFormSubmit}
              defaultValues={currentWorkspaceFormData}
              opType={WORKSPACE_OP_TYPE_UPDATE}
            />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
