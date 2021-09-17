/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { CustomLogo } from './opensearch_dashboards_custom_logo';

describe('Header logo ', () => {
  describe('in default mode ', () => {
    it('rendered using logo default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using the original opensearch logo', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('rendered using logo dark mode URL', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo', darkModeUrl: '/darkModeLogo' },
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using logo default mode URL', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark dark mode URL', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark default mode URL', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using original opensearch logo', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<CustomLogo {...branding} />);
      expect(component).toMatchSnapshot();
    });
  });
});
