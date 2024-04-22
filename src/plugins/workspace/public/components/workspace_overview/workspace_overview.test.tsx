/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { BehaviorSubject } from 'rxjs';
import { PublicAppInfo, WorkspaceObject } from 'opensearch-dashboards/public';
import { IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY, WorkspaceOverview } from './workspace_overview';

// all applications
const PublicAPPInfoMap = new Map([
  ['alerting', { id: 'alerting', title: 'alerting' }],
  ['home', { id: 'home', title: 'home' }],
]);

const mockCoreStart = coreMock.createStart();

const createWorkspacesSetupContractMockWithValue = (workspace?: WorkspaceObject) => {
  const currentWorkspace = workspace
    ? workspace
    : {
        id: 'foo_id',
        name: 'foo',
        description: 'this is my foo workspace description',
        features: ['alerting'],
        color: '',
        icon: '',
        reserved: false,
      };
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

const WorkspaceOverviewPage = (props: any) => {
  const workspacesService = props.workspacesService || createWorkspacesSetupContractMockWithValue();
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        applications$: new BehaviorSubject<Map<string, PublicAppInfo>>(PublicAPPInfoMap as any),
      },
      workspaces: workspacesService,
    },
  });

  return (
    <Provider>
      <WorkspaceOverview {...props} />
    </Provider>
  );
};

const setLocalStorage = jest.fn();
const localStorageMock = {
  getItem: jest.fn(),
  setItem: setLocalStorage,
  removeItem: jest.fn(),
  key: jest.fn(),
  clear: jest.fn(),
};

describe('WorkspaceOverview', () => {
  const localStorage = window.localStorage;

  beforeAll(() => {
    // Mock localStorage globally
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
    });
  });

  it('render workspace overview page normally', async () => {
    const { container } = render(WorkspaceOverviewPage({}));
    expect(container).toMatchSnapshot();
  });

  it('filter getting start cards when workspace features is `*`', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['*'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByTestId } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    expect(getByTestId('workspaceGetStartCards')).toHaveTextContent('Sample Datasets');
    // see more
    expect(getByTestId('workspaceGetStartCards')).toHaveTextContent(
      'Explore more paths to kick-start your OpenSearch journey.'
    );
  });

  it('filter getting start cards when workspace features is subset of all features', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByTestId } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    expect(getByTestId('workspaceGetStartCards')).toHaveTextContent('with Sample Datasets');
    expect(getByTestId('workspaceGetStartCards')).toHaveTextContent('with Alerts');
    // no see more
    expect(getByTestId('workspaceGetStartCards')).not.toHaveTextContent(
      'Explore more paths to kick-start your OpenSearch journey.'
    );
  });

  it('getting start section is expanded by default', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByTestId } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    expect(getByTestId('Collapse')).toBeVisible();
  });

  it('getting start section visible setting will saved to localStorage', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByTestId } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    expect(getByTestId('Collapse')).toBeVisible();
    fireEvent.click(getByTestId('Collapse'));
    expect(getByTestId('Expand')).toBeVisible();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY + '_foo_id',
      'true'
    );
    // click on Collapse
    fireEvent.click(getByTestId('Expand'));
    expect(getByTestId('Collapse')).toBeVisible();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      IS_WORKSPACE_OVERVIEW_COLLAPSED_KEY + '_foo_id',
      'false'
    );
  });

  it('click on library tab will redirect to saved objects page', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    fireEvent.click(getByText('Library'));

    expect(mockCoreStart.application.navigateToApp).toHaveBeenCalledWith('management', {
      path: 'opensearch-dashboards/objects',
    });
  });

  it('click on settings tab will show workspace update page', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    const { getByText } = render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    fireEvent.click(getByText('Settings'));
    expect(screen.queryByText('Workspace Details')).not.toBeNull();
    // title is hidden
    expect(screen.queryByText('Update Workspace')).toBeNull();
  });

  it('default selected tab is overview', async () => {
    const workspaceObject = {
      id: 'foo_id',
      name: 'foo',
      description: 'this is my foo workspace description',
      features: ['alerting', 'home'],
      color: '',
      icon: '',
      reserved: false,
    };
    const workspaceService = createWorkspacesSetupContractMockWithValue(workspaceObject);
    render(WorkspaceOverviewPage({ workspacesService: workspaceService }));
    expect(document.querySelector('#overview')).toHaveClass('euiTab-isSelected');
  });
});
