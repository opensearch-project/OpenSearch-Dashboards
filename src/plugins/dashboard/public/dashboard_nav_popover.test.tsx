/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent } from '@testing-library/react';
import { of } from 'rxjs';
import { dashboardNavPopover } from './dashboard_nav_popover';
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

describe('dashboardNavPopover', () => {
  afterEach(() => jest.clearAllMocks());

  it('declares create + view all actions', () => {
    const ids = (dashboardNavPopover.actions ?? []).map((a) => a.id);
    expect(ids).toEqual(['createNew', 'viewAll']);
  });

  it('navigates to /create on the "Create new dashboard" action', () => {
    const services = makeServices();
    dashboardNavPopover.actions!.find((a) => a.id === 'createNew')!.onClick(services);
    expect(services.navigateToApp).toHaveBeenCalledWith('dashboards', { path: '#/create' });
  });

  it('navigates to /list on the "View all dashboards" action', () => {
    const services = makeServices();
    dashboardNavPopover.actions!.find((a) => a.id === 'viewAll')!.onClick(services);
    expect(services.navigateToApp).toHaveBeenCalledWith('dashboards', { path: '#/list' });
  });

  it('renders nothing for the recent section when there are no recent dashboards', () => {
    const { queryByTestId } = render(<>{dashboardNavPopover.render!(makeServices())}</>);
    expect(queryByTestId('dashboardNavPopover-recent')).not.toBeInTheDocument();
  });

  it('renders up to 5 recent dashboards and navigates on click', () => {
    const navigateToApp = jest.fn();
    const recent: ChromeRecentlyAccessedHistoryItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `dash-${i}`,
      label: `Dashboard ${i}`,
      link: `/app/dashboards#/view/dash-${i}`,
    }));
    const { getAllByTestId, getByTestId } = render(
      <>{dashboardNavPopover.render!(makeServices(navigateToApp, recent))}</>
    );
    expect(getAllByTestId(/^dashboardNavPopover-recent-/).length).toBe(5);

    fireEvent.click(getByTestId('dashboardNavPopover-recent-dash-0'));
    expect(navigateToApp).toHaveBeenCalledWith('dashboards', { path: '#/view/dash-0' });
  });

  it('ignores recently accessed items that are not dashboards', () => {
    const recent: ChromeRecentlyAccessedHistoryItem[] = [
      { id: 'viz-1', label: 'A viz', link: '/app/visualize#/edit/viz-1' },
    ];
    const { queryByTestId } = render(
      <>{dashboardNavPopover.render!(makeServices(jest.fn(), recent))}</>
    );
    expect(queryByTestId('dashboardNavPopover-recent-viz-1')).not.toBeInTheDocument();
    // No dashboards matched → the recent section is omitted entirely.
    expect(queryByTestId('dashboardNavPopover-recent')).not.toBeInTheDocument();
  });
});
