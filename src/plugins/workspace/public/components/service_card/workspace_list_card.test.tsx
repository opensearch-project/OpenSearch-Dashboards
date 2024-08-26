/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { WorkspaceListCard } from './workspace_list_card';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { BehaviorSubject } from 'rxjs';
import { NavGroupItemInMap } from 'opensearch-dashboards/public';

describe('workspace list card render normally', () => {
  const navGroupMap: Record<string, NavGroupItemInMap> = {
    group1: {
      id: 'group1',
      title: 'title',
      description: 'desc',
      navLinks: [
        {
          id: 'link1',
        },
      ],
    },
  };
  const coreStart = {
    ...coreMock.createStart(),
    chrome: {
      ...coreMock.createStart().chrome,
      navGroup: {
        ...coreMock.createStart().chrome.navGroup,
        getNavGroupsMap$: () => new BehaviorSubject(navGroupMap),
      },
    },
  };

  beforeAll(() => {
    const workspaceList = [
      {
        id: 'ws-1',
        name: 'foo',
        lastUpdatedTime: new Date().toISOString(),
        features: ['use-case-group1'],
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
    expect(
      getByText(
        'Contact your administrator to create a workspace or to be added to an existing one.'
      )
    ).toBeInTheDocument();
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

  it('should navigate to workspace use case overview page when click on workspace name', () => {
    const { getByTestId, getByText } = render(<WorkspaceListCard core={coreStart} />);
    const filterSelector = getByTestId('workspace_filter');
    fireEvent.change(filterSelector, { target: { value: 'updated' } });
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently updated');

    // workspace list
    expect(getByText('foo')).toBeInTheDocument();

    fireEvent.click(getByText('foo'));
    expect(coreStart.application.getUrlForApp).toHaveBeenLastCalledWith('link1', {
      absolute: true,
    });
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
    const { getByText, getByTestId } = render(<WorkspaceListCard core={coreStart} />);
    const filterSelector = getByTestId('workspace_filter');
    fireEvent.change(filterSelector, { target: { value: 'updated' } });
    expect(getByTestId('workspace_filter')).toHaveDisplayValue('Recently updated');
    const mockButton = getByText('View all');
    fireEvent.click(mockButton);
    expect(coreStart.application.navigateToApp).toHaveBeenCalledWith('workspace_list');
  });
});
