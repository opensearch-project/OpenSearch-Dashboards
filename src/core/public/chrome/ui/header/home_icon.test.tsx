/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { HomeIcon } from './home_icon';

const defaultOpensearchMarkUrl = '/opensearch_mark_default_mode.svg';
const darkOpensearchMarkUrl = '/opensearch_mark_dark_mode.svg';

describe('Home button icon ', () => {
  describe('in default mode ', () => {
    it('uses opensearch mark if no branding provided', () => {
      const branding = {};
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(defaultOpensearchMarkUrl);
      expect(icon.prop('title')).toEqual(`opensearch dashboards home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch mark if no mark provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${defaultOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch mark if custom logo provided without mark', () => {
      const branding = {
        darkMode: false,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${defaultOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('uses opensearch mark if no mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${darkOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch mark if custom logo provided without mark', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${darkOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL if no dark mode mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark dark mode URL', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.darkModeUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in expanded light mode ', () => {
    it('uses home icon if no mark provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual(`m`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses home icon if custom logo provided without mark', () => {
      const branding = {
        darkMode: false,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual(`m`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('size')).toEqual(`l`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in expanded dark mode ', () => {
    it('uses home icon if no mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual(`m`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses home icon if custom logo provided without mark', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual(`m`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL if no dark mode mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('size')).toEqual(`l`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark dark mode URL', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedMenu: true,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.darkModeUrl);
      expect(icon.prop('size')).toEqual(`l`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });
});
