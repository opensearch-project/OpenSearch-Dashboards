/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { HeaderLogo, DEFAULT_DARK_LOGO, DEFAULT_LOGO } from './header_logo';

const mockProps = () => ({
  href: '/',
  navLinks$: new BehaviorSubject([]),
  forceNavigation$: new BehaviorSubject(false),
  navigateToApp: jest.fn(),
  branding: {},
});

describe('Header logo ', () => {
  describe('in default mode ', () => {
    it('uses opensearch logo if no branding provided', () => {
      const branding = {};
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`opensearch dashboards logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if no logo provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if custom mark provided without logo', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom logo default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(branding.logo.defaultUrl);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('uses opensearch logo if no logo provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_DARK_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if custom mark provided without logo', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_DARK_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom logo default mode URL if no dark mode logo provided', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(branding.logo.defaultUrl);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom logo dark mode URL', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo', darkModeUrl: '/darkModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(branding.logo.darkModeUrl);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });
  });
});
