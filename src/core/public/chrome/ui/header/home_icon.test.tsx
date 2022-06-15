/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { HomeIcon } from './home_icon';

const defaultOpensearchMarkUrl = '/opensearch_mark_default_mode.svg';
const darkOpensearchMarkUrl = '/opensearch_mark_dark_mode.svg';

describe('Header logo ', () => {
  describe('in default mode ', () => {
    it('uses opensearch logo if no branding', () => {
      const branding = {};
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(defaultOpensearchMarkUrl);
      expect(icon.prop('title')).toEqual(`opensearch dashboards home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if no mark provided', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        applicationTitle: 'custom title',
        assetFolderUrl: 'ui/assets',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${defaultOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if custom logo provided without mark', () => {
      const branding = {
        darkMode: false,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(defaultOpensearchMarkUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.defaultUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });

  describe('in dark mode ', () => {
    it('uses opensearch logo if no mark provided', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: {},
        assetFolderUrl: 'ui/assets',
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(`${branding.assetFolderUrl}${darkOpensearchMarkUrl}`);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses opensearch logo if custom logo provided without mark', () => {
      const branding = {
        darkMode: true,
        logo: { defaultUrl: '/defaultModeLogo' },
        mark: {},
        applicationTitle: 'custom title',
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(darkOpensearchMarkUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });

    it('uses custom mark default mode URL if no dark mode mark', () => {
      const branding = {
        darkMode: true,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        applicationTitle: 'custom title',
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
      };
      const component = mountWithIntl(<HomeIcon {...branding} />);
      const icon = component.find('EuiIcon');
      expect(icon.prop('type')).toEqual(branding.mark.darkModeUrl);
      expect(icon.prop('title')).toEqual(`${branding.applicationTitle} home`);
      expect(component).toMatchSnapshot();
    });
  });
});
