/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHeaderProps } from '@elastic/eui';
import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { HeaderLogo, DEFAULT_DARK_LOGO, DEFAULT_LOGO } from './header_logo';
import { BasePath } from '../../../http/base_path';

const basePath = new BasePath('/base');
const mockProps = () => ({
  href: '/',
  basePath,
  navLinks$: new BehaviorSubject([]),
  forceNavigation$: new BehaviorSubject(false),
  navigateToApp: jest.fn(),
  branding: {},
  theme: 'default' as EuiHeaderProps['theme'],
});

describe('Header logo', () => {
  describe('when default-themed ', () => {
    it('uses dashboards logo if no branding is provided', () => {
      const branding = {};
      const props = {
        ...mockProps(),
        branding,
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`opensearch dashboards logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses dashboards logo if branding containing no logo is provided', () => {
      const branding = {
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
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses dashboards logo if branding containing a mark but not a logo is provided', () => {
      const branding = {
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
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom default-mode logo if branding logo is provided', () => {
      const branding = {
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

  describe('when dark-themed', () => {
    it("uses dashboards' dark logo if no branding is provided", () => {
      const branding = {};
      const props = {
        ...mockProps(),
        branding,
        theme: 'dark' as EuiHeaderProps['theme'],
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_DARK_LOGO}`);
      expect(img.prop('alt')).toEqual(`opensearch dashboards logo`);
      expect(component).toMatchSnapshot();
    });

    it("uses dashboards' dark logo if branding containing no logo is provided", () => {
      const branding = {
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
        theme: 'dark' as EuiHeaderProps['theme'],
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_DARK_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it("uses dashboards' dark logo if branding containing a mark but not a logo is provided", () => {
      const branding = {
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
        theme: 'dark' as EuiHeaderProps['theme'],
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(`${basePath.serverBasePath}/${DEFAULT_DARK_LOGO}`);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses default-themed custom logo if branding without dark-mode logo is provided', () => {
      const branding = {
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
        theme: 'dark' as EuiHeaderProps['theme'],
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(branding.logo.defaultUrl);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom dark-mode logo if branding dark-mode logo is provided', () => {
      const branding = {
        logo: { defaultUrl: '/defaultModeLogo', darkModeUrl: '/darkModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const props = {
        ...mockProps(),
        branding,
        theme: 'dark' as EuiHeaderProps['theme'],
      };
      const component = mountWithIntl(<HeaderLogo {...props} />);
      const img = component.find('.logoContainer img');
      expect(img.prop('src')).toEqual(branding.logo.darkModeUrl);
      expect(img.prop('alt')).toEqual(`${branding.applicationTitle} logo`);
      expect(component).toMatchSnapshot();
    });
  });
});
