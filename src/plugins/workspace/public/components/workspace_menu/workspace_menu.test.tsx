/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { WorkspaceMenu } from './workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart, DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { BehaviorSubject } from 'rxjs';
import { IntlProvider } from 'react-intl';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import * as workspaceUtils from '../utils/workspace';

describe('<WorkspaceMenu />', () => {
  let coreStartMock: CoreStart;
  const navigateToApp = jest.fn();
  const registeredUseCases$ = new BehaviorSubject([
    { ...DEFAULT_NAV_GROUPS.observability, features: [{ id: 'discover', title: 'Discover' }] },
  ]);

  beforeEach(() => {
    coreStartMock = coreMock.createStart();
    coreStartMock.application.capabilities = {
      navLinks: {},
      management: {},
      catalogue: {},
      savedObjectsManagement: {},
      workspaces: { permissionEnabled: true },
      dashboards: { isDashboardAdmin: true },
    };
    coreStartMock.application = {
      ...coreStartMock.application,
      navigateToApp,
    };

    coreStartMock.workspaces.initialized$.next(true);
    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
  });

  const WorkspaceMenuCreatorComponent = () => {
    return (
      <IntlProvider locale="en">
        <WorkspaceMenu coreStart={coreStartMock} registeredUseCases$={registeredUseCases$} />
      </IntlProvider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should display a list of workspaces in the dropdown', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenuCreatorComponent />);
    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);

    expect(screen.getByText(/all workspaces/i)).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-item-all-workspace-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-item-all-workspace-2')).toBeInTheDocument();
  });

  it('should display a list of recent workspaces in the dropdown', () => {
    jest.spyOn(recentWorkspaceManager, 'getRecentWorkspaces').mockReturnValue([
      { id: 'workspace-1', timestamp: 1234567890 },
      { id: 'workspace-2', timestamp: 1234567899 },
    ]);

    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'workspace-2', name: 'workspace 2', features: [] },
    ]);

    render(<WorkspaceMenuCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);

    expect(screen.getByText(/recent workspaces/i)).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-item-recent-workspace-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-item-recent-workspace-2')).toBeInTheDocument();
  });

  it('should display current workspace name and use case name', () => {
    coreStartMock.workspaces.currentWorkspace$.next({
      id: 'workspace-1',
      name: 'workspace 1',
      features: ['use-case-observability'],
    });
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('current-workspace-button'));
    expect(screen.getByTestId('workspace-menu-current-workspace-name')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-current-use-case')).toBeInTheDocument();
    expect(screen.getByText('Observability')).toBeInTheDocument();
  });

  it('should navigate to the first feature of workspace use case', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-observability'] },
    ]);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(<WorkspaceMenuCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/workspace 1/i));

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/discover'
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to the workspace detail page when use case is all', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-all'] },
    ]);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(<WorkspaceMenuCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/workspace 1/i));

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/workspace_detail'
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to workspace management page', () => {
    coreStartMock.workspaces.currentWorkspace$.next({
      id: 'workspace-1',
      name: 'workspace 1',
      features: ['use-case-observability'],
    });
    const navigateToWorkspaceDetail = jest.spyOn(workspaceUtils, 'navigateToWorkspaceDetail');
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('current-workspace-button'));
    const button = screen.getByText(/Manage workspace/i);
    fireEvent.click(button);
    expect(navigateToWorkspaceDetail).toBeCalled();
  });

  it('should navigate to workspaces management page', () => {
    render(<WorkspaceMenuCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/manage workspaces/i));
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('workspace_list');
  });

  it('should navigate to create workspace page', () => {
    render(<WorkspaceMenuCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/create workspace/i));
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('workspace_create');
  });

  it('should navigate to workspace list page', () => {
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/View all/i));
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('workspace_list');
  });

  it('should hide create workspace button for non dashboard admin', () => {
    coreStartMock.application.capabilities = {
      ...coreStartMock.application.capabilities,
      dashboards: {
        ...coreStartMock.application.capabilities.dashboards,
        isDashboardAdmin: false,
      },
    };
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-select-button'));
    expect(screen.getByText(/View all/i)).toBeInTheDocument();
    expect(screen.queryByText(/create workspaces/i)).toBeNull();
  });
});
