/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, act } from '@testing-library/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { applicationServiceMock, httpServiceMock } from '../../../mocks';
import { SavedObjectWithMetadata } from './recent_items';
import { RecentItems } from './recent_items';
import { createRecentNavLink } from './nav_link';

jest.mock('./nav_link', () => ({
  createRecentNavLink: jest.fn().mockImplementation(() => {
    return {
      href: '/recent_nav_link',
    };
  }),
}));

const mockRecentlyAccessed$ = new BehaviorSubject([
  {
    id: '6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b',
    label: 'visualizeMock',
    link: '/app/visualize',
    workspaceId: 'workspace_1',
    meta: { type: 'visualization' },
  },
]);

const mockWorkspaceList$ = new BehaviorSubject([
  {
    id: 'workspace_1',
    name: 'WorkspaceMock_1',
  },
]);

const savedObjectsFromServer: SavedObjectWithMetadata[] = [
  {
    type: 'visualization',
    id: '6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:00.000Z',
    meta: {},
  },
];
const defaultMockProps = {
  navigateToUrl: applicationServiceMock.createStartContract().navigateToUrl,
  workspaceList$: new BehaviorSubject([]),
  recentlyAccessed$: new BehaviorSubject([]),
  navLinks$: new BehaviorSubject([
    {
      id: '',
      title: '',
      baseUrl: '',
      href: '',
    },
  ]),
  basePath: httpServiceMock.createStartContract().basePath,
  http: httpServiceMock.createSetupContract(),
  renderBreadcrumbs: <></>,
  loadingCount$: new BehaviorSubject(0),
};

jest.spyOn(defaultMockProps.http, 'get').mockImplementation(
  (url): Promise<SavedObjectWithMetadata> => {
    if (typeof url === 'string') {
      if ((url as string).includes('6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b')) {
        return Promise.resolve(savedObjectsFromServer[0]);
      } else {
        return Promise.resolve(savedObjectsFromServer[1]);
      }
    }
    return Promise.reject(new Error('Invalid URL'));
  }
);

describe('Recent items', () => {
  it('should render base element normally', () => {
    const { baseElement } = render(<RecentItems {...defaultMockProps} />);
    expect(baseElement).toMatchSnapshot();
  });

  it('render with empty recent work', () => {
    const { getByText, getByTestId } = render(<RecentItems {...defaultMockProps} />);
    const mockRecentButton = getByTestId('recentItemsSectionButton');
    fireEvent.click(mockRecentButton);
    expect(getByText('No recently viewed items')).toBeInTheDocument();
  });

  it('should be able to render recent works', async () => {
    const mockProps = {
      ...defaultMockProps,
      recentlyAccessed$: mockRecentlyAccessed$,
      workspaceList$: mockWorkspaceList$,
    };

    await act(async () => {
      render(<RecentItems {...mockProps} />);
    });

    const mockRecentButton = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(mockRecentButton);
    expect(screen.getByText('visualizeMock')).toBeInTheDocument();
  });

  it('should be able to display workspace name if the asset is attched to a workspace and render it with brackets wrapper ', async () => {
    const mockProps = {
      ...defaultMockProps,
      recentlyAccessed$: mockRecentlyAccessed$,
      workspaceList$: mockWorkspaceList$,
    };

    await act(async () => {
      render(<RecentItems {...mockProps} />);
    });

    const mockRecentButton = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(mockRecentButton);
    expect(screen.getByText('(WorkspaceMock_1)')).toBeInTheDocument();
  });

  it('should call navigateToUrl with link generated from createRecentNavLink when clicking a recent item', async () => {
    const mockProps = {
      ...defaultMockProps,
      recentlyAccessed$: mockRecentlyAccessed$,
      workspaceList$: mockWorkspaceList$,
    };

    const navigateToUrl = jest.fn();

    await act(async () => {
      render(<RecentItems {...mockProps} navigateToUrl={navigateToUrl} />);
    });

    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);
    const item = screen.getByText('visualizeMock');
    expect(navigateToUrl).not.toHaveBeenCalled();
    fireEvent.click(item);
    expect(navigateToUrl).toHaveBeenCalledWith('/recent_nav_link');
  });

  it('should be able to display the preferences popover setting when clicking Preferences button', async () => {
    const mockProps = {
      ...defaultMockProps,
      recentlyAccessed$: mockRecentlyAccessed$,
    };

    await act(async () => {
      render(<RecentItems {...mockProps} />);
    });

    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);

    const preferencesButton = screen.getByTestId('preferencesSettingButton');
    fireEvent.click(preferencesButton);
    expect(screen.getByTestId('preferencesSettingPopover')).toBeInTheDocument();
  });

  it('should show loading indicator if loading count > 0', () => {
    const { baseElement } = render(
      <RecentItems {...defaultMockProps} loadingCount$={new BehaviorSubject(1)} />
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('should show not display item if it is in a workspace which is not available', () => {
    render(<RecentItems {...defaultMockProps} recentlyAccessed$={mockRecentlyAccessed$} />);
    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
  });

  it('workspace feature flag should be passed to createRecentNavLink correctly', async () => {
    jest.clearAllMocks();
    const { getByTestId, findByText, getByText } = render(
      <RecentItems
        {...defaultMockProps}
        workspaceEnabled
        recentlyAccessed$={mockRecentlyAccessed$}
        workspaceList$={mockWorkspaceList$}
      />
    );
    fireEvent.click(getByTestId('recentItemsSectionButton'));
    await findByText('Recent assets');
    fireEvent.click(getByText('visualizeMock'));
    expect(createRecentNavLink).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true
    );
  });
});
