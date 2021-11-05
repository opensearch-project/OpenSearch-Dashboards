/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { OverviewPageHeader } from './overview_page_header';
import { shallowWithIntl } from 'test_utils/enzyme_helpers';

jest.mock('../../app_links', () => ({
  RedirectAppLinks: jest.fn((element: JSX.Element) => element),
}));

jest.mock('../../context', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      application: { capabilities: { navLinks: { management: true, dev_tools: true } } },
      notifications: { toast: { addSuccess: jest.fn() } },
    },
  }),
}));

afterAll(() => jest.clearAllMocks());

const mockTitle = 'Page Title';
const addBasePathMock = jest.fn((path: string) => (path ? path : 'path'));

describe('OverviewPageHeader ', () => {
  describe('in default mode ', () => {
    test('render logo as custom default mode logo', () => {
      const branding = {
        darkMode: false,
        mark: {
          defaultUrl: '/defaultModeLogo',
          darkModeUrl: '/darkModeLogo',
        },
      };

      const component = shallowWithIntl(
        <OverviewPageHeader addBasePath={addBasePathMock} title={mockTitle} branding={branding} />
      );
      expect(component).toMatchSnapshot();
    });

    test('render logo as original default mode opensearch mark', () => {
      const branding = {
        darkMode: false,
        mark: {},
      };

      const component = shallowWithIntl(
        <OverviewPageHeader addBasePath={addBasePathMock} title={mockTitle} branding={branding} />
      );
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    test('render logo as custom dark mode logo', () => {
      const branding = {
        darkMode: false,
        mark: {
          defaultUrl: '/defaultModeLogo',
          darkModeUrl: '/darkModeLogo',
        },
      };

      const component = shallowWithIntl(
        <OverviewPageHeader addBasePath={addBasePathMock} title={mockTitle} branding={branding} />
      );
      expect(component).toMatchSnapshot();
    });

    test('render logo as custom default mode logo', () => {
      const branding = {
        darkMode: false,
        mark: {
          defaultUrl: '/defaultModeLogo',
        },
      };

      const component = shallowWithIntl(
        <OverviewPageHeader addBasePath={addBasePathMock} title={mockTitle} branding={branding} />
      );
      expect(component).toMatchSnapshot();
    });

    test('render logo as original dark mode opensearch mark', () => {
      const branding = {
        darkMode: false,
        mark: {},
      };

      const component = shallowWithIntl(
        <OverviewPageHeader addBasePath={addBasePathMock} title={mockTitle} branding={branding} />
      );
      expect(component).toMatchSnapshot();
    });
  });
});
