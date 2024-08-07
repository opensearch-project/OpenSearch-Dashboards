/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { WorkspaceListCard } from './workspace_list_card';
import { recentWorkspaceManager } from '../../recent_workspace_manager';

describe('workspace list card render normally', () => {
  const coreStart = coreMock.createStart();

  beforeAll(() => {
    const workspaceList = [
      {
        id: 'ws-1',
        name: 'foo',
        lastUpdatedTime: new Date().toISOString(),
      },
      {
        id: 'ws-2',
        name: 'bar',
        lastUpdatedTime: new Date().toISOString(),
      },
    ];
    coreStart.workspaces.workspaceList$.next(workspaceList);
  });

  it('should show workspace list card correctly', () => {
    const { container } = render(<WorkspaceListCard core={coreStart} />);
    expect(container).toMatchSnapshot();
  });

  it('should show empty state if no recently viewed workspace', () => {
    const { getByTestId, getByText } = render(<WorkspaceListCard core={coreStart} />);
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently viewed');

    // empty statue for recently viewed
    expect(getByText('Workspaces you have recently viewed will appear here.')).toBeInTheDocument();
  });

  it('should show default filter as recently viewed', () => {
    recentWorkspaceManager.addRecentWorkspace('foo');
    const { getByTestId, getByText } = render(<WorkspaceListCard core={coreStart} />);
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently viewed');

    waitFor(() => {
      expect(getByText('foo')).toBeInTheDocument();
    });
  });

  it('should show updated filter correctly', () => {
    const { getByTestId, getByText } = render(<WorkspaceListCard core={coreStart} />);
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently viewed');

    const filterSelector = getByTestId('workspace_filter');
    fireEvent.change(filterSelector, { target: { value: 'updated' } });
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently updated');

    // workspace list
    expect(getByText('foo')).toBeInTheDocument();
    expect(getByText('bar')).toBeInTheDocument();
  });

  it('should render create workspace button when is dashboard admin and navigate to create new workspace page when clicking on plus button', () => {
    coreStart.application.capabilities = {
      ...coreStart.application.capabilities,
      dashboards: {
        isDashboardAdmin: true,
      },
    };

    const { getByTestId } = render(<WorkspaceListCard core={coreStart} />);
    const mockButton = getByTestId('create_workspace');
    fireEvent.click(mockButton);
    expect(coreStart.application.navigateToApp).toHaveBeenCalledWith('workspace_create');
  });

  it('should navigate to workspace list page when click on View all button', () => {
    const { getByText } = render(<WorkspaceListCard core={coreStart} />);
    const mockButton = getByText('View all');
    fireEvent.click(mockButton);
    expect(coreStart.application.navigateToApp).toHaveBeenCalledWith('workspace_list');
  });
});
