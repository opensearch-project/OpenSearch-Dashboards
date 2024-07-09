/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WorkspaceMenu } from './workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from '../../../../../core/public';
import { addRecentWorkspace } from '../../utils';

describe('<WorkspaceMenu />', () => {
  let coreStartMock: CoreStart;

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

    coreStartMock.workspaces.initialized$.next(true);
    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('should display a list of workspaces in the dropdown', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));

    expect(screen.getByText(/all workspaces/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace 2/i)).toBeInTheDocument();
  });

  it('should display a list of recent workspaces in the dropdown', () => {
    addRecentWorkspace('workspace-1');
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));

    expect(screen.getByText(/recent workspaces/i)).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-recent-workspaces')).toHaveTextContent(/workspace 1/i);
    localStorage.clear();
  });

  it('should display current workspace name and use case', () => {
    coreStartMock.workspaces.currentWorkspace$.next({ id: 'workspace-1', name: 'workspace 1' });
    render(<WorkspaceMenu coreStart={coreStartMock} />);
    expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/workspace 1/i));
    expect(screen.getByTestId('context-menu-current-workspace-name')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-current-use-case')).toBeInTheDocument();
  });

  it('should close the workspace dropdown list', async () => {
    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));

    expect(screen.getByText(/all workspaces/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('current-workspace-button'));
    await waitFor(() => {
      expect(screen.queryByText(/all workspaces/i)).not.toBeInTheDocument();
    });
  });

  it('should navigate to the workspace', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));
    fireEvent.click(screen.getByText(/workspace 1/i));

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/workspace_overview'
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to current workspace saved objects page', () => {
    coreStartMock.workspaces.currentWorkspace$.next({ id: 'workspace-1', name: 'workspace 1' });
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });
    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspace 1/i));
    expect(screen.getByText(/view workspace saved objects/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/view workspace saved objects/i));
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/management/opensearch-dashboards/objects'
    );
    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to create workspace page', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));
    fireEvent.click(screen.getByText(/create workspace/i));
    expect(window.location.assign).toHaveBeenCalledWith('https://test.com/app/workspace_create');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should navigate to workspace list page', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/workspaces/i));
    fireEvent.click(screen.getByText(/View all/i));
    expect(window.location.assign).toHaveBeenCalledWith('https://test.com/app/workspace_list');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
});
