/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNavLinkStatus, DEFAULT_APP_CATEGORIES } from '../../../../../core/public';
import { convertApplicationsToFeaturesOrGroups } from './utils';

describe('convertApplicationsToFeaturesOrGroups', () => {
  it('should group same category applications in same feature group', () => {
    expect(
      convertApplicationsToFeaturesOrGroups([
        {
          id: 'foo',
          title: 'Foo',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        },
        {
          id: 'bar',
          title: 'Bar',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        },
        {
          id: 'baz',
          title: 'Baz',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.observability,
        },
      ])
    ).toEqual([
      {
        name: 'OpenSearch Dashboards',
        features: [
          {
            id: 'foo',
            name: 'Foo',
          },
          {
            id: 'bar',
            name: 'Bar',
          },
        ],
      },
      {
        name: 'Observability',
        features: [
          {
            id: 'baz',
            name: 'Baz',
          },
        ],
      },
    ]);
  });
  it('should return features if application without category', () => {
    expect(
      convertApplicationsToFeaturesOrGroups([
        {
          id: 'foo',
          title: 'Foo',
          navLinkStatus: AppNavLinkStatus.visible,
        },
        {
          id: 'baz',
          title: 'Baz',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.observability,
        },
        {
          id: 'bar',
          title: 'Bar',
          navLinkStatus: AppNavLinkStatus.visible,
        },
      ])
    ).toEqual([
      {
        id: 'foo',
        name: 'Foo',
      },
      {
        id: 'bar',
        name: 'Bar',
      },
      {
        name: 'Observability',
        features: [
          {
            id: 'baz',
            name: 'Baz',
          },
        ],
      },
    ]);
  });
});
