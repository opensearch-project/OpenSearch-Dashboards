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
      workspaces: { isDashboardAdmin: true, permissionEnabled: true },
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
    fireEvent.click(screen.getByText(/select a workspace/i));

    expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace 2/i)).toBeInTheDocument();
  });

  it('should display a list of use cases in the dropdown', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    coreStartMock.workspaces.workspaceList$.next([
      {
        id: 'workspace-1',
        name: 'workspace 1',
        features: [
          'use-case-observability',
          'use-case-security-analytics',
          'use-case-analytics',
          'use-case-search',
        ],
      },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));

    const rightArrowButton = screen
      .getByTestId('context-menu-item-workspace-1')
      .querySelector('.euiContextMenu__icon')!;
    expect(rightArrowButton).toBeInTheDocument();

    fireEvent.click(rightArrowButton);

    await waitFor(() => {
      expect(screen.getByText(/observability/i)).toBeInTheDocument();
      expect(screen.getByText(/security-analytics/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/observability/i));

    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/workspace_overview'
    );

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });

  it('should display a list of recent workspaces in the dropdown', () => {
    addRecentWorkspace('workspace-1');
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));

    expect(screen.getByText(/recent workspaces/i)).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-recent-workspaces')).toHaveTextContent(/workspace 1/i);
    localStorage.clear();
  });

  it('should search a workspace in the dropdown', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));
    const searchField = screen.getByPlaceholderText(/find a workspace/i);

    expect(searchField).toBeInTheDocument();

    fireEvent.change(searchField, { target: { value: 'workspace 1' } });

    expect(screen.getByText('workspace 1')).toBeInTheDocument();
    expect(screen.queryByText('workspace 2')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByText(/select a workspace/i));

    expect(screen.getByText(/all workspaces/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/select a workspace/i));
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
    fireEvent.click(screen.getByText(/select a workspace/i));
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
    fireEvent.click(screen.getByText(/select a workspace/i));
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
    fireEvent.click(screen.getByText(/select a workspace/i));
    fireEvent.click(screen.getByText(/View all/i));
    expect(window.location.assign).toHaveBeenCalledWith('https://test.com/app/workspace_list');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
});
