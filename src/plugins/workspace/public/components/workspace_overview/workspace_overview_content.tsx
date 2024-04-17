/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiTitle,
  EuiFlexItem,
  EuiCard,
  EuiFlexGroup,
  EuiPage,
  EuiPanel,
  EuiPageContent,
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
    <EuiPage paddingSize="m">
      <EuiPageContent hasShadow={false} borderRadius={'none'}>
        <EuiFlexGroup>
          <EuiFlexItem grow={2}>
            <EuiCard
              layout="horizontal"
              title="About"
              titleSize="xs"
              description={currentWorkspace?.description || ''}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={8}>
            <EuiPanel>
              <EuiTitle size="xs">
                <span>Recent items</span>
              </EuiTitle>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageContent>
    </EuiPage>
  );
};
