/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import moment from 'moment';
import React from 'react';
import { Overview } from './overview';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';
import { FeatureCatalogueCategory } from 'src/plugins/home/public';
import { getLogosMock } from '../../../../../core/common/mocks';

jest.mock('../../../../../../src/plugins/opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      http: { basePath: { prepend: jest.fn((path: string) => (path ? path : 'path')) } },
      data: { indexPatterns: {} },
      uiSettings: { get: jest.fn() },
    },
  }),
  RedirectAppLinks: jest.fn((element: JSX.Element) => element),
  OverviewPageFooter: jest.fn().mockReturnValue(<></>),
  OverviewPageHeader: jest.fn().mockReturnValue(<></>),
}));

afterAll(() => jest.clearAllMocks());

const mockNewsFetchResult = {
  error: null,
  feedItems: [
    {
      badge: null,
      description:
        'The official Go client now includes features like request retries and node discovery. Learn more about its architecture and package and repository layout.',
      expireOn: moment('2050-12-31T11:59:59Z'),
      hash: '8e18fcedbc',
      linkText: 'Read more on the blog',
      linkUrl: 'https://opensearch.org/docs/latest/clients/go/',
      publishOn: moment('2020-08-31T10:23:47Z'),
      title: 'The Go client for OpenSearch: Introduction',
    },
    {
      badge: null,
      description:
        'Learn how to use Elastic Uptime to configure alerting and anomaly detection for sites, services, and APIs.',
      expireOn: moment('2050-12-31T11:59:59Z'),
      hash: 'fb3e3d42ef',
      linkText: 'Read more on the blog',
      linkUrl: 'https://opensearch.org/docs/latest/monitoring-plugins/ad/index/',
      publishOn: moment('2020-08-14T10:23:47Z'),
      title: 'Alerting and anomaly detection for uptime and reliability',
    },
    {
      badge: null,
      description:
        'Managing data using hot-warm architecture and ILM is a cost-effective way of retaining data — and a great way to easily keep your cloud costs down.',
      expireOn: moment('2050-12-31T11:59:59Z'),
      hash: 'b2fc7d47d5',
      linkText: 'Learn more on the blog',
      linkUrl:
        'https://opensearch.org/docs/latest/opensearch/cluster/#advanced-step-7-set-up-a-hot-warm-architecture',
      publishOn: moment('2020-08-01T10:23:47Z'),
      title: 'Optimizing costs in Elastic Cloud: Hot-warm + index lifecycle management',
    },
  ],
  hasNew: true,
  opensearchDashboardsVersion: '8.0.0',
};

const mockSolutions = [
  {
    id: 'opensearchDashboards',
    title: 'OpenSearch Dashboards',
    subtitle: 'Visualize & analyze',
    appDescriptions: ['Analyze data in dashboards'],
    icon: 'inputOutput',
    path: 'opensearch_dashboards_landing_page',
    order: 1,
  },
  {
    id: 'solution-2',
    title: 'Solution two',
    subtitle: 'Subtitle for solution two',
    description: 'Description of solution two',
    appDescriptions: ['Example use case'],
    icon: 'empty',
    path: 'path-to-solution-two',
    order: 2,
  },
  {
    id: 'solution-3',
    title: 'Solution three',
    subtitle: 'Subtitle for solution three',
    description: 'Description of solution three',
    appDescriptions: ['Example use case'],
    icon: 'empty',
    path: 'path-to-solution-three',
    order: 3,
  },
  {
    id: 'solution-4',
    title: 'Solution four',
    subtitle: 'Subtitle for solution four',
    description: 'Description of solution four',
    appDescriptions: ['Example use case'],
    icon: 'empty',
    path: 'path-to-solution-four',
    order: 4,
  },
];

const mockFeatures = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Description of dashboard',
    icon: 'dashboardApp',
    path: 'dashboard_landing_page',
    showOnHomePage: false,
    category: FeatureCatalogueCategory.DATA,
  },
  {
    id: 'discover',
    title: 'Discover',
    description: 'Description of discover',
    icon: 'discoverApp',
    path: 'discover_landing_page',
    showOnHomePage: false,
    category: FeatureCatalogueCategory.DATA,
  },
  {
    id: 'canvas',
    title: 'Canvas',
    description: 'Description of canvas',
    icon: 'canvasApp',
    path: 'canvas_landing_page',
    showOnHomePage: false,
    category: FeatureCatalogueCategory.DATA,
  },
];

const makeProps = () => ({
  newsFetchResult: mockNewsFetchResult,
  solutions: mockSolutions,
  features: mockFeatures,
  logos: getLogosMock.default,
});

describe('Overview', () => {
  describe('renders', () => {
    it('with solutions and features', () => {
      const props = {
        ...makeProps(),
      };
      const component = shallowWithIntl(<Overview {...props} />);
      expect(component).toMatchSnapshot();
    });

    it('without solutions and with features', () => {
      const props = {
        ...makeProps(),
        solutions: [],
      };
      const component = shallowWithIntl(<Overview {...props} />);
      expect(component).toMatchSnapshot();
    });
    it('with solutions and without features', () => {
      const props = {
        ...makeProps(),
        features: [],
      };
      const component = shallowWithIntl(<Overview {...props} />);
      expect(component).toMatchSnapshot();
    });
  });

  // ToDo: Add tests for all the complications of Overview
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4693
  it.todo('renders each of the complications of Overview');
});
