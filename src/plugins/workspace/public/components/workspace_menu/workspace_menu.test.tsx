/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WorkspaceMenu } from './workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from '../../../../../core/public';

describe('<WorkspaceMenu />', () => {
  let coreStartMock: CoreStart;

  beforeEach(() => {
    coreStartMock = coreMock.createStart();
    coreStartMock.workspaces.initialized$.next(true);
    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should display a list of workspaces and use case in the dropdown', async () => {
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
      { id: 'workspace-2', name: 'workspace 2', features: ['use-case-observability'] },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));

    expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace 2/i)).toBeInTheDocument();

    const rightArrowButton = screen
      .getByTestId('context-menu-item-workspace-1')
      .querySelector('.euiContextMenu__icon')!;
    expect(rightArrowButton).toBeInTheDocument();

    fireEvent.click(rightArrowButton);

    await waitFor(() => {
      expect(screen.getByText(/use case/i)).toBeInTheDocument();
      expect(screen.getByText(/observability/i)).toBeInTheDocument();
      expect(screen.getByText(/security-analytics/i)).toBeInTheDocument();
    });
  });

  it('should search a workspace in the dropdown', () => {
    coreStartMock.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1' },
      { id: 'workspace-2', name: 'workspace 2' },
    ]);

    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));
    const searchField = screen.getByPlaceholderText('find a workspace');

    expect(searchField).toBeInTheDocument();

    fireEvent.change(searchField, { target: { value: 'workspace 1' } });

    expect(screen.getByText('workspace 1')).toBeInTheDocument();
    expect(screen.queryByText('workspace 2')).not.toBeInTheDocument();
  });

  it('should display current workspace name', () => {
    coreStartMock.workspaces.currentWorkspace$.next({ id: 'workspace-1', name: 'workspace 1' });
    render(<WorkspaceMenu coreStart={coreStartMock} />);
    expect(screen.getByText(/workspace 1/i)).toBeInTheDocument();
  });

  it('should close the workspace dropdown list', async () => {
    render(<WorkspaceMenu coreStart={coreStartMock} />);
    fireEvent.click(screen.getByText(/select a workspace/i));

    expect(screen.getByText(/ALL WORKSPACE/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/select a workspace/i));
    await waitFor(() => {
      expect(screen.queryByText(/ALL WORKSPACE/i)).not.toBeInTheDocument();
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
