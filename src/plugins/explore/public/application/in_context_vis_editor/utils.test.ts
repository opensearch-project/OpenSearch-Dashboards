/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBreadcrumbs } from './utils';

const mockNavigateToApp = jest.fn();
const mockNavigateToWithEmbeddablePackage = jest.fn();
const mockEmbeddable = {
  getStateTransfer: () => ({
    navigateToWithEmbeddablePackage: mockNavigateToWithEmbeddablePackage,
  }),
} as any;

describe('getBreadcrumbs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns visualize list breadcrumb when no originatingApp', () => {
    const breadcrumbs = getBreadcrumbs(mockNavigateToApp, mockEmbeddable);
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].text).toBe('Visualize');
    breadcrumbs[0].onClick();
    expect(mockNavigateToApp).toHaveBeenCalledWith('visualize');
  });

  it('returns correct breadcrumbs for new dashboard', () => {
    const breadcrumbs = getBreadcrumbs(mockNavigateToApp, mockEmbeddable, 'dashboard');
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].text).toBe('Dashboards');
    expect(breadcrumbs[1].text).toBe('New dashboard');
    breadcrumbs[1].onClick();
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });

  it('returns correct breadcrumbs for existing dashboard', () => {
    const containerInfo = { containerName: 'My Dashboard', containerId: 'dash-1' };
    const breadcrumbs = getBreadcrumbs(
      mockNavigateToApp,
      mockEmbeddable,
      'dashboard',
      containerInfo
    );
    expect(breadcrumbs).toHaveLength(2);
    expect(breadcrumbs[0].text).toBe('Dashboards');
    expect(breadcrumbs[1].text).toBe('My Dashboard');
    breadcrumbs[1].onClick();
    expect(mockNavigateToWithEmbeddablePackage).toHaveBeenCalledWith('dashboard');
  });
});
