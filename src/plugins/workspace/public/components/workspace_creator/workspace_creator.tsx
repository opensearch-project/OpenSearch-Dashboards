/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiPage, EuiPageBody, EuiPageHeader, EuiPageContent } from '@elastic/eui';

import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';

import { WorkspaceForm } from './workspace_form';

export const WorkspaceCreator = () => {
  const {
    services: { application },
  } = useOpenSearchDashboards();

  const handleWorkspaceFormSubmit = useCallback(() => {}, []);

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
            <WorkspaceForm application={application} onSubmit={handleWorkspaceFormSubmit} />
          )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
