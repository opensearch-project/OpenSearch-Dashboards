/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPageHeader, EuiButton, EuiPanel, EuiSpacer, EuiTitle } from '@elastic/eui';
import { useObservable } from 'react-use';
import { of } from 'rxjs';

import { useOpenSearchDashboards } from '../../../../../src/plugins/opensearch_dashboards_react/public';

export const WorkspaceOverview = () => {
  const {
    services: { workspaces },
  } = useOpenSearchDashboards();

  const currentWorkspace = useObservable(
    workspaces ? workspaces.client.currentWorkspace$ : of(null)
  );

  return (
    <>
      <EuiPageHeader
        pageTitle="Overview"
        rightSideItems={[
          <EuiButton color="danger">Delete</EuiButton>,
          <EuiButton>Update</EuiButton>,
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
