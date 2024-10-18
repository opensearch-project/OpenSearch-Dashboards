/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import moment from 'moment';
import { WorkspaceSelector } from './workspace_selector';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart, DEFAULT_NAV_GROUPS, WorkspaceObject } from '../../../../../core/public';
import { BehaviorSubject } from 'rxjs';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { I18nProvider } from '@osd/i18n/react';
describe('<WorkspaceSelector />', () => {
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

    const mockCurrentWorkspace = [{ id: 'workspace-1', name: 'workspace 1' }];
    coreStartMock.workspaces.currentWorkspace$ = new BehaviorSubject<WorkspaceObject | null>(
      mockCurrentWorkspace
    );

    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
  });

  const WorkspaceSelectorCreatorComponent = () => {
    return (
      <I18nProvider>
        <WorkspaceSelector coreStart={coreStartMock} registeredUseCases$={registeredUseCases$} />
      </I18nProvider>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should display the current workspace name', () => {
    render(<WorkspaceSelectorCreatorComponent />);
    expect(screen.getByTestId('workspace-selector-current-title')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-selector-current-name')).toBeInTheDocument();
  });

  it('should display a list of workspaces in the dropdown', () => {
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);

    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'workspace-2', name: 'workspace 2', features: [] },
    ]);

    render(<WorkspaceSelectorCreatorComponent />);
    const selectButton = screen.getByTestId('workspace-selector-button');
    fireEvent.click(selectButton);

    expect(screen.getByText('workspace 1')).toBeInTheDocument();
    expect(screen.getByText('workspace 2')).toBeInTheDocument();
  });

  it('should display viewed xx ago for recent workspaces, and Not visited recently for never-visited workspace', () => {
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);

    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'workspace-2', name: 'workspace 2', features: [] },
    ]);
    render(<WorkspaceSelectorCreatorComponent />);
    const selectButton = screen.getByTestId('workspace-selector-button');
    fireEvent.click(selectButton);

    expect(screen.getByText(`Viewed ${moment(1234567890).fromNow()}`)).toBeInTheDocument();
    expect(screen.getByText('Not visited recently')).toBeInTheDocument();
  });

  it('should be able to display empty state when the workspace list is empty', () => {
    coreStartMock.workspaces.workspaceList$.next([]);
    render(<WorkspaceSelectorCreatorComponent />);
    const selectButton = screen.getByTestId('workspace-selector-button');
    fireEvent.click(selectButton);
    expect(screen.getByText(/no workspace available/i)).toBeInTheDocument();
  });

  it('should be able to perform search and filter and the results will be shown', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'test-2', name: 'test 2', features: [] },
    ]);
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);
    render(<WorkspaceSelectorCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-selector-button');
    fireEvent.click(selectButton);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'works' } });
    expect(screen.getByText('workspace 1')).toBeInTheDocument();
    expect(screen.queryByText('test 2')).not.toBeInTheDocument();
  });

  it('should be able to display empty state when seach is not found', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: [] },
      { id: 'test-2', name: 'test 2', features: [] },
    ]);
    jest
      .spyOn(recentWorkspaceManager, 'getRecentWorkspaces')
      .mockReturnValue([{ id: 'workspace-1', timestamp: 1234567890 }]);
    render(<WorkspaceSelectorCreatorComponent />);

    const selectButton = screen.getByTestId('workspace-selector-button');
    fireEvent.click(selectButton);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'noitems' } });
    expect(screen.getByText(/no workspace available/i)).toBeInTheDocument();
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

    render(<WorkspaceSelectorCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-selector-button'));
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

    render(<WorkspaceSelectorCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-selector-button'));
    fireEvent.click(screen.getByText(/workspace 1/i));

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/workspace_detail'
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to create workspace page', () => {
    render(<WorkspaceSelectorCreatorComponent />);
    fireEvent.click(screen.getByTestId('workspace-selector-button'));
    fireEvent.click(screen.getByText(/create workspace/i));
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('workspace_create');
  });

  it('should navigate to workspace list page', () => {
    render(<WorkspaceSelectorCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-selector-button'));
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
    render(<WorkspaceSelectorCreatorComponent />);

    fireEvent.click(screen.getByTestId('workspace-selector-button'));
    expect(screen.queryByText(/manage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create workspaces/i)).toBeNull();
  });
});
