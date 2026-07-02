/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { of } from 'rxjs';
import { buildExploreNavPopover } from './nav_popover';
import { ExploreFlavor } from '../common';
import { httpServiceMock } from '../../../core/public/mocks';
import { NavPopoverServices, ChromeRecentlyAccessedHistoryItem } from '../../../core/public';

const mockBasePath = httpServiceMock.createSetupContract({ basePath: '/test' }).basePath;

const makeServices = (
  navigateToApp = jest.fn(),
  recent: ChromeRecentlyAccessedHistoryItem[] = []
): NavPopoverServices => ({
  navigateToApp,
  basePath: mockBasePath,
  http: httpServiceMock.createStartContract(),
  recentlyAccessed$: of(recent),
});

describe('buildExploreNavPopover (Logs)', () => {
  const popover = buildExploreNavPopover(ExploreFlavor.Logs);

  afterEach(() => jest.clearAllMocks());

  it('declares new + browse actions', () => {
    expect((popover.actions ?? []).map((a) => a.id)).toEqual(['newSearch', 'browseSaved']);
  });

  it('opens a blank logs search on "New search"', () => {
    const services = makeServices();
    popover.actions!.find((a) => a.id === 'newSearch')!.onClick(services);
    expect(services.navigateToApp).toHaveBeenCalledWith('explore/logs', { path: '#/' });
  });

  it('navigates to logs with the open-saved marker on "Browse saved searches"', () => {
    const services = makeServices();
    popover.actions!.find((a) => a.id === 'browseSaved')!.onClick(services);
    expect(services.navigateToApp).toHaveBeenCalledWith('explore/logs', {
      path: '#/?_openSaved=true',
    });
  });

  it('renders recent log searches and opens by path on click', () => {
    const navigateToApp = jest.fn();
    const recent: ChromeRecentlyAccessedHistoryItem[] = [
      { id: 'a', label: 'Error rate', link: '/app/explore/logs#/view/a' },
      { id: 'b', label: 'A trace', link: '/app/explore/traces#/view/b' },
    ];
    const { getByTestId, queryByTestId } = render(
      <>{popover.render!(makeServices(navigateToApp, recent))}</>
    );
    // Only the logs item is shown (traces filtered out).
    expect(getByTestId('exploreNavPopover-recent-logs-a')).toBeInTheDocument();
    expect(queryByTestId('exploreNavPopover-recent-logs-b')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('exploreNavPopover-recent-logs-a'));
    expect(navigateToApp).toHaveBeenCalledWith('explore/logs', { path: '#/view/a' });
  });

  it('renders nothing for the recent section when there are no recent logs searches', () => {
    const { queryByTestId } = render(<>{popover.render!(makeServices())}</>);
    expect(queryByTestId('exploreNavPopover-recent-logs')).not.toBeInTheDocument();
  });
});
