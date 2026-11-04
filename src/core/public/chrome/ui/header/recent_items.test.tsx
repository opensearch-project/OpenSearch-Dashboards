/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, act } from '@testing-library/react';

import { BehaviorSubject } from 'rxjs';
import { applicationServiceMock, httpServiceMock } from '../../../mocks';
import { HttpFetchOptionsWithPath } from '../../../http';
import { ChromeRecentlyAccessedHistoryItem } from '../../recently_accessed';
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

const mockRecentlyAccessed$ = new BehaviorSubject<ChromeRecentlyAccessedHistoryItem[]>([
  {
    id: '6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b',
    label: 'visualizeMock',
    link: '/app/visualize',
    workspaceId: 'workspace_1',
    meta: { type: 'visualization' },
  },
  {
    id: 'fake-dashboard-id',
    label: 'Fake Dashboards',
    link: '/app/dashboards',
    workspaceId: 'workspace_1',
    meta: { type: 'dashboards' },
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
  {
    type: 'dashboards',
    id: 'fake-dashboard-id',
    error: {
      statusCode: 404,
      error: 'Saved object not found',
      message: 'Not found',
    },
    attributes: {},
    references: [],
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

describe('Recent items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(defaultMockProps.http.get).mockReset();
    jest
      .mocked(defaultMockProps.http.get)
      .mockImplementation(
        (url: string | HttpFetchOptionsWithPath): Promise<SavedObjectWithMetadata> => {
          if (typeof url === 'string') {
            if (url.includes('6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b')) {
              return Promise.resolve(savedObjectsFromServer[0]);
            } else {
              return Promise.resolve(savedObjectsFromServer[1]);
            }
          }
          return Promise.reject(new Error('Invalid URL'));
        }
      );
  });

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
    expect(await screen.findByText('visualizeMock')).toBeInTheDocument();
    expect(screen.queryByText('Fake Dashboards')).not.toBeInTheDocument();
  });

  it('should be able to display workspace name if the asset is attached to a workspace and render it with brackets wrapper ', async () => {
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
    expect(await screen.findByText('(WorkspaceMock_1)')).toBeInTheDocument();
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
    const item = await screen.findByText('visualizeMock');
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
    fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
    expect(defaultMockProps.http.get).not.toHaveBeenCalled();
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
    await findByText('visualizeMock');
    fireEvent.click(getByText('visualizeMock'));
    expect(createRecentNavLink).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true
    );
  });

  it('does not load details while closed, including history and workspace updates', () => {
    const recentlyAccessed$ = new BehaviorSubject(mockRecentlyAccessed$.getValue());
    const workspaceList$ = new BehaviorSubject(mockWorkspaceList$.getValue());
    render(<RecentItems {...defaultMockProps} {...{ recentlyAccessed$, workspaceList$ }} />);

    act(() => {
      workspaceList$.next([{ id: 'workspace_1', name: 'Renamed workspace' }]);
      recentlyAccessed$.next(
        recentlyAccessed$.getValue().map((item) => ({
          ...item,
          meta: { ...item.meta, lastAccessedTime: Date.now() },
        }))
      );
    });

    expect(defaultMockProps.http.get).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'reuses loaded details on reopening (accessible items: %s)',
    async (hasItems) => {
      if (!hasItems) {
        jest.mocked(defaultMockProps.http.get).mockResolvedValue(savedObjectsFromServer[1]);
      }
      render(
        <RecentItems
          {...defaultMockProps}
          recentlyAccessed$={mockRecentlyAccessed$}
          workspaceList$={mockWorkspaceList$}
        />
      );
      const button = screen.getByTestId('recentItemsSectionButton');
      fireEvent.click(button);
      const expectedText = hasItems ? 'visualizeMock' : 'No recently viewed items';
      await screen.findByText(expectedText);
      expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
      expect(defaultMockProps.http.get).toHaveBeenCalledWith(
        expect.stringContaining('/management/saved_objects/visualization/'),
        { prependOptions: { withoutClientBasePath: true } }
      );

      await act(async () => {
        fireEvent.mouseDown(document.body);
      });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByLabelText('Loading recent items')).not.toBeInTheDocument();
      await act(async () => {
        fireEvent.click(button);
      });

      expect(screen.getByText(expectedText)).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading recent items')).not.toBeInTheDocument();
      expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
    }
  );

  it.each([true, false])(
    'updates history order, labels, and workspace names without reloading (menu open: %s)',
    async (menuOpen) => {
      const first = mockRecentlyAccessed$.getValue()[0];
      const second = {
        ...first,
        id: 'another-visualization',
        label: 'Second visualization',
        link: '/app/visualize/another-visualization',
      };
      const recentlyAccessed$ = new BehaviorSubject([first, second]);
      const workspaceList$ = new BehaviorSubject(mockWorkspaceList$.getValue());
      jest
        .mocked(defaultMockProps.http.get)
        .mockImplementation(async (url: string | HttpFetchOptionsWithPath) => ({
          ...savedObjectsFromServer[0],
          id: typeof url === 'string' && url.endsWith(second.id) ? second.id : first.id,
        }));
      render(<RecentItems {...defaultMockProps} {...{ recentlyAccessed$, workspaceList$ }} />);
      fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
      await screen.findByText('visualizeMock');
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'visualizeMock (WorkspaceMock_1)',
        'Second visualization (WorkspaceMock_1)',
      ]);

      if (!menuOpen) {
        await act(async () => {
          fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
        });
      }

      act(() => {
        recentlyAccessed$.next([
          {
            ...second,
            label: 'Updated visualization',
            meta: { ...second.meta, lastAccessedTime: 10 },
          },
          first,
        ]);
        workspaceList$.next([{ id: 'workspace_1', name: 'Renamed workspace' }]);
      });

      if (!menuOpen) {
        await act(async () => {
          fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
        });
      }

      expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Second visualization')).not.toBeInTheDocument();
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
        'Updated visualization (Renamed workspace)',
        'visualizeMock (Renamed workspace)',
      ]);
    }
  );

  it('loads changed object identities on the next opening after a change while closed', async () => {
    const first = mockRecentlyAccessed$.getValue()[0];
    const recentlyAccessed$ = new BehaviorSubject([first]);
    render(
      <RecentItems
        {...defaultMockProps}
        recentlyAccessed$={recentlyAccessed$}
        workspaceList$={mockWorkspaceList$}
      />
    );
    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);
    await screen.findByText('visualizeMock');
    await act(async () => {
      fireEvent.click(button);
    });

    const second = { ...first, id: 'new-visualization', label: 'New asset' };
    jest.mocked(defaultMockProps.http.get).mockResolvedValueOnce({
      ...savedObjectsFromServer[0],
      id: second.id,
    });
    act(() => {
      recentlyAccessed$.next([second]);
    });
    expect(defaultMockProps.http.get).toHaveBeenCalledTimes(1);

    fireEvent.click(button);
    expect(await screen.findByText('New asset')).toBeInTheDocument();
    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
    expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
  });

  it.each([
    { id: 'new-visualization', type: 'visualization' },
    { id: '6ef856c0-5f86-11ef-b7df-1bb1cf26ce5b', type: 'dashboard' },
  ])('loads changed object identities while open: %j', async ({ id, type }) => {
    const first = mockRecentlyAccessed$.getValue()[0];
    const recentlyAccessed$ = new BehaviorSubject([first]);
    render(
      <RecentItems
        {...defaultMockProps}
        recentlyAccessed$={recentlyAccessed$}
        workspaceList$={mockWorkspaceList$}
      />
    );
    fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
    await screen.findByText('visualizeMock');

    const second = { ...first, id, meta: { type }, label: 'New asset' };
    jest.mocked(defaultMockProps.http.get).mockResolvedValueOnce({
      ...savedObjectsFromServer[0],
      id: second.id,
      type,
    });
    act(() => {
      recentlyAccessed$.next([second]);
    });

    expect(await screen.findByText('New asset')).toBeInTheDocument();
    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
    expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
  });

  it('removes entries immediately when their workspace is no longer available', async () => {
    const workspaceList$ = new BehaviorSubject(mockWorkspaceList$.getValue());
    render(
      <RecentItems
        {...defaultMockProps}
        recentlyAccessed$={mockRecentlyAccessed$}
        workspaceList$={workspaceList$}
      />
    );
    fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
    await screen.findByText('visualizeMock');

    act(() => {
      workspaceList$.next([]);
    });

    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
    expect(screen.getByText('No recently viewed items')).toBeInTheDocument();
    expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    'retains pending details after an outside click (reopen before completion: %s)',
    async (reopenBeforeCompletion) => {
      const pendingDetails = Promise.withResolvers<SavedObjectWithMetadata>();
      jest.mocked(defaultMockProps.http.get).mockReturnValueOnce(pendingDetails.promise);
      render(
        <RecentItems
          {...defaultMockProps}
          recentlyAccessed$={new BehaviorSubject([mockRecentlyAccessed$.getValue()[0]])}
          workspaceList$={mockWorkspaceList$}
        />
      );
      const button = screen.getByTestId('recentItemsSectionButton');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(screen.getByLabelText('Loading recent items')).toBeInTheDocument();

      await act(async () => {
        fireEvent.mouseDown(document.body);
      });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByLabelText('Loading recent items')).toBeInTheDocument();

      if (reopenBeforeCompletion) {
        await act(async () => {
          fireEvent.click(button);
        });
        expect(defaultMockProps.http.get).toHaveBeenCalledTimes(1);
      }

      await act(async () => {
        pendingDetails.resolve(savedObjectsFromServer[0]);
      });

      if (!reopenBeforeCompletion) {
        await act(async () => {
          fireEvent.click(button);
        });
      }

      expect(screen.getByText('visualizeMock')).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading recent items')).not.toBeInTheDocument();
      expect(defaultMockProps.http.get).toHaveBeenCalledTimes(1);
    }
  );

  it('ignores previous object details that complete after the requested objects change', async () => {
    const first = mockRecentlyAccessed$.getValue()[0];
    const second = { ...first, id: 'new-visualization', label: 'New asset' };
    const recentlyAccessed$ = new BehaviorSubject([first]);
    const firstRequest = Promise.withResolvers<SavedObjectWithMetadata>();
    const secondRequest = Promise.withResolvers<SavedObjectWithMetadata>();
    jest.mocked(defaultMockProps.http.get).mockReturnValueOnce(firstRequest.promise);
    jest.mocked(defaultMockProps.http.get).mockReturnValueOnce(secondRequest.promise);
    render(
      <RecentItems
        {...defaultMockProps}
        recentlyAccessed$={recentlyAccessed$}
        workspaceList$={mockWorkspaceList$}
      />
    );
    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);
    expect(screen.getByLabelText('Loading recent items')).toBeInTheDocument();
    expect(screen.queryByText('No recently viewed items')).not.toBeInTheDocument();
    act(() => {
      recentlyAccessed$.next([second]);
    });

    await act(async () => {
      secondRequest.resolve({ ...savedObjectsFromServer[0], id: second.id });
    });
    expect(screen.getByText('New asset')).toBeInTheDocument();

    await act(async () => {
      firstRequest.resolve(savedObjectsFromServer[0]);
    });
    expect(screen.queryByText('visualizeMock')).not.toBeInTheDocument();
    expect(screen.getByText('New asset')).toBeInTheDocument();
    expect(defaultMockProps.http.get).toHaveBeenCalledTimes(2);
  });

  it('omits failed requests and keeps accessible items', async () => {
    jest
      .mocked(defaultMockProps.http.get)
      .mockImplementation(async (url: string | HttpFetchOptionsWithPath) => {
        if (typeof url === 'string' && url.includes('/dashboards/')) {
          throw new Error('Forbidden');
        }
        return savedObjectsFromServer[0];
      });
    render(
      <RecentItems
        {...defaultMockProps}
        recentlyAccessed$={mockRecentlyAccessed$}
        workspaceList$={mockWorkspaceList$}
      />
    );
    fireEvent.click(screen.getByTestId('recentItemsSectionButton'));
    expect(await screen.findByText('visualizeMock')).toBeInTheDocument();
    expect(screen.queryByText('Fake Dashboards')).not.toBeInTheDocument();
  });
});
