/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { PublicAppInfo, WorkspaceObject } from 'opensearch-dashboards/public';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { WORKSPACE_USE_CASES } from '../../../common/constants';
import { WorkspaceDetail } from './workspace_detail';

// all applications
const PublicAPPInfoMap = new Map([
  ['alerting', { id: 'alerting', title: 'alerting' }],
  ['home', { id: 'home', title: 'home' }],
]);

const mockCoreStart = coreMock.createStart();

const workspaceObject = {
  id: 'foo_id',
  name: 'foo',
  description: 'this is my foo workspace description',
  features: ['use-case-observability'],
  color: '',
  icon: '',
  reserved: false,
};

const createWorkspacesSetupContractMockWithValue = (workspace?: WorkspaceObject) => {
  const currentWorkspace = workspace ? workspace : workspaceObject;
  const currentWorkspaceId$ = new BehaviorSubject<string>(currentWorkspace.id);
  const workspaceList$ = new BehaviorSubject<WorkspaceObject[]>([currentWorkspace]);
  const currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(currentWorkspace);
  const initialized$ = new BehaviorSubject<boolean>(true);
  return {
    currentWorkspaceId$,
    workspaceList$,
    currentWorkspace$,
    initialized$,
  };
};

const WorkspaceDetailPage = (props: any) => {
  const workspacesService = props.workspacesService || createWorkspacesSetupContractMockWithValue();
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
        capabilities: {
          ...mockCoreStart.application.capabilities,
          workspaces: {
            permissionEnabled: true,
          },
        },
      },
      workspaces: workspacesService,
      savedObjects: {
        ...mockCoreStart.savedObjects,
        client: {
          ...mockCoreStart.savedObjects.client,
          find: jest.fn().mockResolvedValue({
            savedObjects: [],
          }),
        },
      },
    },
  });

  const registeredUseCases$ = new BehaviorSubject([
    WORKSPACE_USE_CASES.observability,
    WORKSPACE_USE_CASES['security-analytics'],
    WORKSPACE_USE_CASES.analytics,
    WORKSPACE_USE_CASES.search,
  ]);

  return (
    <Provider>
      <WorkspaceDetail registeredUseCases$={registeredUseCases$} {...props} />
    </Provider>
  );
};

describe('WorkspaceDetail', () => {
  it('render workspace detail page normally', async () => {
    const { container } = render(WorkspaceDetailPage({}));
    expect(container).toMatchSnapshot();
  });

  it('default selected tab is overview', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    expect(screen.queryByText('foo')).not.toBeNull();
    expect(document.querySelector('#overview')).toHaveClass('euiTab-isSelected');
  });

  it('click on collaborators tab will workspace update page with permission', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    await act(async () => {
      fireEvent.click(getByText('Collaborators'));
    });
    expect(document.querySelector('#collaborators')).toHaveClass('euiTab-isSelected');
    await waitFor(() => {
      expect(screen.queryByText('Manage access and permissions')).not.toBeNull();
    });
  });

  it('click on settings tab will show workspace update page', async () => {
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceDetailPage({ workspacesService: workspaceService }));
    fireEvent.click(getByText('Settings'));
    expect(document.querySelector('#settings')).toHaveClass('euiTab-isSelected');
    await waitFor(() => {
      expect(screen.queryByText('Enter details')).not.toBeNull();
    });
  });
});
