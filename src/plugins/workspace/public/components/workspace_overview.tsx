/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageHeader, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { ApplicationStart } from '../../../../core/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';

export const WorkspaceOverview = () => {
  const {
    services: { workspaces },
  } = useOpenSearchDashboards<{ application: ApplicationStart }>();

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));

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
