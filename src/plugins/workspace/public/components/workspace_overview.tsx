/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageHeader, EuiButton, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { PATHS } from '../../common/constants';
import { ApplicationStart } from '../../../../core/public';
import { WORKSPACE_APP_ID, WORKSPACE_ID_IN_SESSION_STORAGE } from '../../common/constants';

import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';

export const WorkspaceOverview = () => {
  const {
    services: { workspaces, application, notifications },
  } = useOpenSearchDashboards<{ application: ApplicationStart }>();

  const currentWorkspace = useObservable(
    workspaces ? workspaces.client.currentWorkspace$ : of(null)
  );

  const onUpdateWorkspaceClick = () => {
    if (!currentWorkspace || !currentWorkspace.id) {
      notifications?.toasts.addDanger({
        title: i18n.translate('Cannot find current workspace', {
          defaultMessage: 'Cannot update workspace',
        }),
      });
      return;
    }
    application.navigateToApp(WORKSPACE_APP_ID, {
      path: PATHS.update + '?' + WORKSPACE_ID_IN_SESSION_STORAGE + '=' + currentWorkspace.id,
    });
  };

  return (
    <>
      <EuiPageHeader
        pageTitle="Overview"
        rightSideItems={[
          <EuiButton color="danger">Delete</EuiButton>,
          <EuiButton onClick={onUpdateWorkspaceClick}>Update</EuiButton>,
        ]}
      />
      <EuiPanel>
        <EuiTitle size="m">
          <h3>Workspace</h3>
        </EuiTitle>
        <EuiSpacer />
        {JSON.stringify(currentWorkspace)}
      </EuiPanel>
    </>
  );
};
