/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexItem,
  EuiCard,
  EuiFlexGroup,
  EuiPage,
  EuiPageContent,
  EuiPageBody,
  EuiSpacer,
} from '@elastic/eui';
import React from 'react';
import { useObservable } from 'react-use';
import { of } from 'rxjs';
import { useOpenSearchDashboards } from '../../../../../plugins/opensearch_dashboards_react/public';

export const WorkspaceOverviewContent = () => {
  const {
    services: { workspaces },
  } = useOpenSearchDashboards();

  const currentWorkspace = useObservable(workspaces ? workspaces.currentWorkspace$ : of(null));

  return (
    <EuiPage paddingSize="none">
      <EuiPageBody>
        <EuiSpacer />
        <EuiPageContent color="subdued" hasShadow={false} paddingSize="none">
          <EuiFlexGroup>
            <EuiFlexItem grow={2}>
              <EuiCard
                style={{ height: '200px' }}
                layout="horizontal"
                title="About"
                titleSize="xs"
                description={currentWorkspace?.description || ''}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={8} />
          </EuiFlexGroup>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
