/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBreadcrumbsFromPath } from './breadcrumbs';

describe('breadcrumbs utils', () => {
  const ROUTES = [
    {
      path: '/create',
      Component: jest.fn(),
      label: 'Create',
    },
    {
      path: '/manage',
      Component: jest.fn(),
      label: 'Manage Workspaces',
    },
    {
      path: '/manage/access',
      Component: jest.fn(),
      label: 'Manage Access',
    },
  ];

  it('should create breadcrumbs with matched route', () => {
    const breadcrumbs = createBreadcrumbsFromPath('/create', ROUTES, '/');
    expect(breadcrumbs).toEqual([{ href: '/', text: 'Workspace' }, { text: 'Create' }]);
  });

  it('should create breadcrumbs with only root route if path did not match any route', () => {
    const breadcrumbs = createBreadcrumbsFromPath('/unknown', ROUTES, '/');
    expect(breadcrumbs).toEqual([{ href: '/', text: 'Workspace' }]);
  });

  it('should create breadcrumbs with all matched routes', () => {
    const breadcrumbs = createBreadcrumbsFromPath('/manage/access', ROUTES, '/');
    expect(breadcrumbs).toEqual([
      { href: '/', text: 'Workspace' },
      { href: '/manage', text: 'Manage Workspaces' },
      { text: 'Manage Access' },
    ]);
  });

  it('should create breadcrumbs with only matched routes', () => {
    const breadcrumbs = createBreadcrumbsFromPath('/manage/not-matched', ROUTES, '/');
    expect(breadcrumbs).toEqual([{ href: '/', text: 'Workspace' }, { text: 'Manage Workspaces' }]);
  });
});
