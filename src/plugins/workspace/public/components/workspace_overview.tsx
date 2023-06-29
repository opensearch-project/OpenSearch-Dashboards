/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPageHeader, EuiButton, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { i18n } from '@osd/i18n';
import { ApplicationStart, WORKSPACE_ID_QUERYSTRING_NAME } from '../../../../core/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { PATHS } from '../../common/constants';
import { WORKSPACE_APP_ID } from '../../common/constants';

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
      path: PATHS.update + '?' + WORKSPACE_ID_QUERYSTRING_NAME + '=' + currentWorkspace.id,
    });
  };

  return (
    <>
      <EuiPageHeader pageTitle="Overview" />
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
