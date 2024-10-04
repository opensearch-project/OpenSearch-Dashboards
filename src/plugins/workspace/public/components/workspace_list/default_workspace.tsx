/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject, of } from 'rxjs';
import { useObservable } from 'react-use';
import { EuiFlexItem, EuiPanel, EuiFlexGroup, EuiText, EuiHorizontalRule } from '@elastic/eui';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceListInner } from '.';
import { Services, WorkspaceUseCase } from '../../types';

interface Props {
  services: Services;
  registeredUseCases$: BehaviorSubject<WorkspaceUseCase[]>;
}

export const UserDefaultWorkspace = ({ services, registeredUseCases$ }: Props) => {
  const { workspaces } = services;
  const workspaceList = useObservable(workspaces?.workspaceList$ ?? of([]), []);

  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <EuiPanel>
        <EuiFlexGroup direction="column" gutterSize="xs">
          <EuiFlexItem>
            <EuiText>
              <h3>Workspaces ({workspaceList?.length})</h3>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiHorizontalRule margin="s" />
          </EuiFlexItem>
          <EuiFlexItem>
            <WorkspaceListInner
              fullPage={false}
              selectable={false}
              searchable={false}
              registeredUseCases$={registeredUseCases$}
              excludedActionNames={['edit', 'delete']}
              includedColumns={[
                { field: 'name', width: '25%' },
                { field: 'useCase', width: '20%' },
                { field: 'description', width: '25%' },
                { field: 'permissionMode', width: '10%' },
              ]}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </OpenSearchDashboardsContextProvider>
  );
};
