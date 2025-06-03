/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { RecentWork } from './recent_work';
import { coreMock } from '../../../../core/public/mocks';
import { ChromeRecentlyAccessedHistoryItem } from 'opensearch-dashboards/public';
import { SavedObjectWithMetadata } from '../types';
import { APP_ID } from '../plugin';

const mockedRecentItems: ChromeRecentlyAccessedHistoryItem[] = [
  {
    link: '/app/visualize',
    label: 'visualize',
    id: 'visualize',
    meta: {
      type: 'visualize',
      lastAccessedTime: 1726648949036,
    },
    workspaceId: 'foo',
  },
  {
    link: '/app/dashboard',
    label: 'dashboard',
    id: 'dashboard-in-workspace',
    workspaceId: 'foo',
    meta: {
      type: 'dashboard',
      lastAccessedTime: 1726648948036,
    },
  },
  {
    link: '/app/index-pattern',
    label: 'My Index pattern',
    id: 'index-pattern',
    workspaceId: 'bar',
    meta: {},
  },
];

const savedObjectsFromServer: SavedObjectWithMetadata[] = [
  {
    type: 'visualize',
    id: 'visualize',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:00.000Z',
    meta: {
      title: 'My Visualize',
      inAppUrl: {
        path: '/app/visualize#/visualize/visualize',
        uiCapabilitiesPath: 'visualize.show',
      },
    },
    workspaces: ['foo'],
  },
  {
    type: 'dashboard',
    id: 'dashboard-in-workspace',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:01.000Z',
    meta: {
      title: 'My Dashboard',
      inAppUrl: {
        path: '/app/dashboards#/dashboard-in-workspace',
        uiCapabilitiesPath: 'dashboard.show',
      },
    },
    workspaces: ['foo'],
  },
  {
    type: 'index-pattern',
    id: 'index-pattern',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:01.000Z',
    meta: {
      title: 'My Index pattern',
      inAppUrl: {
        path: '/app/home#/index-pattern/index-pattern',
        uiCapabilitiesPath: 'indexPattern.show',
      },
    },
    workspaces: ['bar'],
  },
];

const recentlyUpdateObjects = {
  savedObjects: [
    {
      type: 'search',
      id: 'search-in-workspace',
      attributes: {},
      references: [],
      updated_at: '2024-07-20T00:00:01.000Z',
      meta: {
        title: 'My Search',
        inAppUrl: {
          path: '/app/search#/search-in-workspace',
          uiCapabilitiesPath: 'search.show',
        },
      },
      workspaces: ['foo'],
    },
  ],
};

const workspaceList = [
  {
    id: 'foo',
    name: 'foo Workspace',
  },
];

const currentWorkspace = workspaceList[0];

const getStartMockForRecentWork = () => {
  const coreStartMock = coreMock.createStart();
  coreStartMock.chrome.recentlyAccessed.get$.mockReturnValue(new BehaviorSubject([]));
  coreStartMock.chrome.navLinks.getNavLinks$.mockReturnValue(new BehaviorSubject([]));
  coreStartMock.workspaces.workspaceList$.next(workspaceList);
  coreStartMock.workspaces.currentWorkspace$.next(currentWorkspace);
  return coreStartMock;
};

jest.mock('../lib', () => {
  const originalModule = jest.requireActual('../lib');

  return {
    ...originalModule,
    findObjects: jest.fn(() => recentlyUpdateObjects),
  };
});

describe('<RecentWork />', () => {
  it('render with empty recent work', async () => {
    const { findByText } = render(<RecentWork core={getStartMockForRecentWork()} />);
    await findByText('No assets to display');
  });

  it('render with recent works - recently viewed', async () => {
    const coreStartMock = getStartMockForRecentWork();
    coreStartMock.http.get.mockImplementation((url) => {
      if (typeof url === 'string') {
        if ((url as string).includes(mockedRecentItems[0].id)) {
          return Promise.resolve(savedObjectsFromServer[0]);
        } else {
          return Promise.resolve(savedObjectsFromServer[1]);
        }
      }

      return Promise.reject({});
    });

    coreStartMock.chrome.recentlyAccessed.get$.mockReturnValue(
      new BehaviorSubject(mockedRecentItems)
    );

    const { findAllByTestId, queryByText } = render(<RecentWork core={coreStartMock} />);
    const allCards = await findAllByTestId('recentlyCard');
    expect(allCards.length).toBe(2);
    expect(allCards[0].querySelector('.euiCard__titleAnchor')?.textContent).toEqual(
      mockedRecentItems[0].label.charAt(0).toUpperCase() + mockedRecentItems[0].label.slice(1)
    );
    // bar workspace item will not show
    expect(queryByText('My Index pattern')).not.toBeInTheDocument();
  });

  it('render with recent works with workspace enabled', async () => {
    const coreStartMock = getStartMockForRecentWork();
    // no current workspace
    coreStartMock.workspaces.currentWorkspace$.next(null);
    coreStartMock.http.get.mockImplementation((url) => {
      if (typeof url === 'string') {
        if ((url as string).includes(mockedRecentItems[0].id)) {
          return Promise.resolve(savedObjectsFromServer[0]);
        } else {
          return Promise.resolve(savedObjectsFromServer[1]);
        }
      }

      return Promise.reject({});
    });

    coreStartMock.chrome.recentlyAccessed.get$.mockReturnValue(
      new BehaviorSubject(mockedRecentItems)
    );

    const { findAllByTestId, queryAllByText } = render(
      <RecentWork core={coreStartMock} workspaceEnabled={true} />
    );
    const allCards = await findAllByTestId('recentlyCard');
    expect(allCards.length).toBe(2);

    // workspace name will display
    expect(queryAllByText('foo Workspace')).toHaveLength(2);
  });

  it('render with recent works - recently updated', async () => {
    const coreStartMock = getStartMockForRecentWork();
    coreStartMock.http.get.mockImplementation((url) => {
      if (typeof url === 'string') {
        if ((url as string).includes(mockedRecentItems[0].id)) {
          return Promise.resolve(savedObjectsFromServer[0]);
        } else {
          return Promise.resolve(savedObjectsFromServer[1]);
        }
      }

      return Promise.reject({});
    });

    coreStartMock.chrome.recentlyAccessed.get$.mockReturnValue(
      new BehaviorSubject(mockedRecentItems)
    );

    const { findAllByTestId, getByTestId, queryByText } = render(
      <RecentWork core={coreStartMock} workspaceEnabled={true} />
    );
    const allCards = await findAllByTestId('recentlyCard');
    expect(allCards.length).toBe(2);

    // click the recently updated filter
    act(() => {
      fireEvent.click(getByTestId('filterButton-Recently%20updated'));
    });

    await waitFor(() => expect(queryByText('Search')).toBeInTheDocument());
    const allCardsAfterSort = await findAllByTestId('recentlyCard');
    expect(allCardsAfterSort[0].querySelector('.euiCard__titleAnchor')?.href).toEqual(
      'http://localhost/w/foo/app/search#/search-in-workspace'
    );
    expect(allCardsAfterSort[0].querySelector('.euiCard__description')?.textContent).toEqual(
      'My Search'
    );
  });

  it('should be able to show view all button', () => {
    const { getByText } = render(<RecentWork core={getStartMockForRecentWork()} />);
    expect(getByText('View all')).toBeInTheDocument();
  });

  it('should be able to be linked to the expected page when clicking View all button', () => {
    const coreStartMock = getStartMockForRecentWork();
    const { getByText } = render(<RecentWork core={coreStartMock} />);
    const mockedViewAllButton = getByText('View all');
    fireEvent.click(mockedViewAllButton);
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith(APP_ID);
  });
});
