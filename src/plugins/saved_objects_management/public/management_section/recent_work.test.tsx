/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { fireEvent, render } from '@testing-library/react';
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
    },
  },
  {
    link: '/app/dashboard',
    label: 'dashboard',
    id: 'dashboard-in-workspace',
    workspaceId: 'workspace-id',
    meta: {
      type: 'dashboard',
    },
  },
];

const savedObjectsFromServer: SavedObjectWithMetadata[] = [
  {
    type: 'visualize',
    id: 'visualize',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:00.000Z',
    meta: {},
  },
  {
    type: 'dashboard',
    id: 'dashboard-in-workspace',
    attributes: {},
    references: [],
    updated_at: '2024-07-20T00:00:01.000Z',
    meta: {},
  },
];

const getStartMockForRecentWork = () => {
  const coreStartMock = coreMock.createStart();
  coreStartMock.chrome.recentlyAccessed.get$.mockReturnValue(new BehaviorSubject([]));
  coreStartMock.chrome.navLinks.getNavLinks$.mockReturnValue(new BehaviorSubject([]));
  return coreStartMock;
};

describe('<RecentWork />', () => {
  it('render with emty recent work', async () => {
    const { findByText } = render(<RecentWork core={getStartMockForRecentWork()} />);
    await findByText('No assets found');
  });

  it('render with recent works', async () => {
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

    const { findAllByTestId, getByTestId } = render(<RecentWork core={coreStartMock} />);
    const allCards = await findAllByTestId('recentlyCard');
    expect(allCards.length).toBe(2);
    expect(allCards[0].querySelector('.euiCard__titleAnchor')?.textContent).toEqual(
      mockedRecentItems[0].label.charAt(0).toUpperCase() + mockedRecentItems[0].label.slice(1)
    );

    // click the filter button
    fireEvent.click(getByTestId('filterButton-Recently%20updated'));
    const allCardsAfterSort = await findAllByTestId('recentlyCard');
    expect(allCardsAfterSort[0].querySelector('.euiCard__titleAnchor')?.textContent).toEqual(
      mockedRecentItems[1].label.charAt(0).toUpperCase() + mockedRecentItems[1].label.slice(1)
    );
  });

  it('should be able to show view all button', () => {
    const { getByText } = render(<RecentWork core={getStartMockForRecentWork()} />);
    expect(getByText('View all')).toBeInTheDocument();
  });

  it('shoule be able to be linked to the expected page when clicking View all button', () => {
    const coreStartMock = getStartMockForRecentWork();
    const { getByText } = render(<RecentWork core={coreStartMock} />);
    const mockedViewAllButton = getByText('View all');
    fireEvent.click(mockedViewAllButton);
    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith(APP_ID);
  });
});
