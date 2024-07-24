/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { scopedHistoryMock } from '../../../../core/public/mocks';
import { getScopedBreadcrumbs } from './react_router_navigate';

describe('getScopedBreadcrumbs', () => {
  it('should return scoped bread crumbs when given an array', () => {
    const history = scopedHistoryMock.create({
      pathname: '/base',
    });
    history.createHref.mockImplementation((location) => `/base${location.pathname}`);
    const scopedBreadcrumbs = getScopedBreadcrumbs(
      [
        {
          text: 'Home',
          href: '/',
        },
        {
          text: 'Dashboard',
          href: '/dashboard',
        },
      ],
      history
    );
    expect(scopedBreadcrumbs[0]).toEqual(
      expect.objectContaining({
        href: '/base/',
        text: 'Home',
      })
    );
    expect(scopedBreadcrumbs[1]).toEqual(
      expect.objectContaining({
        href: '/base/dashboard',
        text: 'Dashboard',
      })
    );
  });
});
