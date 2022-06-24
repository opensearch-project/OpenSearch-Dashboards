/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { DEFAULT_MARK, DEFAULT_DARK_MARK, HomeIcon } from './home_icon';

// TODO: many of these tests cover the conditional logic of which mark to load depending on raw branding configurations
// Dark mode and custom/default fallbacks should instead be consolidated and centralized elsewhere:
// https://github.com/opensearch-project/OpenSearch-Dashboards/issues/895#issuecomment-1164995007
describe('Home button icon ', () => {
  describe('in condensed light mode ', () => {
    it('uses opensearch mark if no mark provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_MARK}`);
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
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_MARK}`);
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
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in condensed dark mode ', () => {
    it('uses opensearch mark if no mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_DARK_MARK}`);
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
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}/${DEFAULT_DARK_MARK}`);
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
        useExpandedHeader: false,
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
        useExpandedHeader: false,
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.darkModeUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in light mode ', () => {
    it('uses home icon if no branding provided', () => {
      const branding = {};
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual('home');
      expect(icon.prop('size')).toEqual(`m`);
      expect(icon.prop('title')).toEqual(`opensearch dashboards home`);
      expect(component).toMatchSnapshot();
    });

    it('uses home icon if no mark provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
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
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('size')).toEqual(`l`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('uses home icon if no mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'base/ui/default_branding',
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
