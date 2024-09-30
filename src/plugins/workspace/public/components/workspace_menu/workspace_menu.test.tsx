/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import moment from 'moment';
import { WorkspaceMenu } from './workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart, DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { BehaviorSubject } from 'rxjs';
import { IntlProvider } from 'react-intl';
import { recentWorkspaceManager } from '../../recent_workspace_manager';

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

    expect(screen.getByTestId('workspace-menu-item-workspace-1')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-item-workspace-2')).toBeInTheDocument();
  });

  it('should display a list of recent workspaces in the dropdown', () => {
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);

    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'workspace-2', name: 'workspace 2', features: [] },
    ]);

    render(<WorkspaceMenuCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);

    expect(screen.getByText(`viewed ${moment(1234567890).fromNow()}`)).toBeInTheDocument();
  });

  it('should be able to display empty state when the workspace list is empty', () => {
    coreStartMock.workspaces.workspaceList$.next([]);
    render(<WorkspaceMenuCreatorComponent />);
    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);
    expect(screen.getByText(/no workspace available/i)).toBeInTheDocument();
  });

  it('should be able to perform search and filter and the results will be shown in both all and recent section', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'test-2', name: 'test 2', features: [] },
    ]);
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);
    render(<WorkspaceMenuCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'works' } });
    expect(screen.getByTestId('workspace-menu-item-workspace-1')).toBeInTheDocument();
    expect(screen.queryByText('workspace-menu-item-workspace-1')).not.toBeInTheDocument();
  });

  it('should be able to display empty state when seach is not found', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'test-2', name: 'test 2', features: [] },
    ]);
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);
    render(<WorkspaceMenuCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-select-button');
    fireEvent.click(selectButton);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'noitems' } });
    expect(screen.getByText(/no workspace available/i)).toBeInTheDocument();
  });

  it('should display current workspace name, use case name and associated icon', () => {
    coreStartMock.workspaces.currentWorkspace$.next({
      id: 'workspace-1',
      name: 'workspace 1',
      features: ['use-case-observability'],
    });
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-select-button'));
    expect(screen.getByTestId('workspace-menu-current-workspace-name')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-menu-current-workspace-use-case')).toBeInTheDocument();
    expect(screen.getByTestId('current-workspace-icon-wsObservability')).toBeInTheDocument();
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

  it('should navigate to create workspace page', () => {
    render(<WorkspaceMenuCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/create workspace/i));
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('workspace_create');
  });

  it('should navigate to workspace list page', () => {
    render(<WorkspaceMenuCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-select-button'));
    fireEvent.click(screen.getByText(/manage/i));
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
    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create workspaces/i)).toBeNull();
  });
});
