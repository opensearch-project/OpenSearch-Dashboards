/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WorkspaceMenu } from './workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from '../../../../../core/public';
import { BehaviorSubject, of } from 'rxjs';
import { IntlProvider } from 'react-intl';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { WORKSPACE_USE_CASES } from '../../../common/constants';
import * as workspaceUtils from '../utils/workspace';

describe('<WorkspaceMenu />', () => {
  let coreStartMock: CoreStart;
  const navigateToApp = jest.fn();
  const registeredUseCases$ = new BehaviorSubject([
    WORKSPACE_USE_CASES.observability,
    WORKSPACE_USE_CASES['security-analytics'],
    WORKSPACE_USE_CASES.analytics,
    WORKSPACE_USE_CASES.search,
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
      { id: 'workspace-2', name: 'workspace 2', features: [] },
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

  it('should close the workspace dropdown list', async () => {
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-select-button'));

    expect(screen.getByText(/all workspaces/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    await waitFor(() => {
      expect(screen.queryByText(/all workspaces/i)).not.toBeInTheDocument();
    });
  });

  it('should navigate to the workspace', () => {
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
});
