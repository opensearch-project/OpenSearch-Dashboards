/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { injectedMetadataServiceMock } from '../../../public/mocks';
import { httpServiceMock } from '../../http/http_service.mock';
import { Template } from './template';
import { renderWithIntl } from 'test_utils/enzyme_helpers';

const http = httpServiceMock.createStartContract();
const injectedMetadata = injectedMetadataServiceMock.createSetupContract();

function mockProps() {
  return {
    uiPublicUrl: `${http.basePath}/ui`,
    locale: '',
    darkMode: true,
    themeVersion: 'v7',
    i18n: () => '',
    bootstrapScriptUrl: `${http.basePath}/bootstrap.js`,
    strictCsp: true,
    injectedMetadata: {
      version: injectedMetadata.getOpenSearchDashboardsVersion(),
      buildNumber: 1,
      branch: injectedMetadata.getBasePath(),
      basePath: '',
      serverBasePath: '',
      env: {
        packageInfo: {
          version: '',
          branch: '',
          buildNum: 1,
          buildSha: '',
          dist: true,
        },
        mode: {
          name: 'production' as 'development' | 'production',
          dev: true,
          prod: false,
        },
      },
      anonymousStatusPage: injectedMetadata.getAnonymousStatusPage(),
      i18n: { translationsUrl: '' },
      csp: injectedMetadata.getCspConfig(),
      vars: injectedMetadata.getInjectedVars(),
      uiPlugins: injectedMetadata.getPlugins(),
      legacyMetadata: {
        uiSettings: {
          defaults: { legacyInjectedUiSettingDefaults: true },
          user: {},
        },
      },
      branding: injectedMetadata.getBranding(),
      survey: injectedMetadata.getSurvey(),
    },
  };
}

describe('Loading page ', () => {
  describe('logo in default mode ', () => {
    it('rendered using loading logo default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        loadingLogo: { defaultUrl: 'defaultModeLoadingLogo/' },
        applicationTitle: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark default mode URL with horizontal loading bar', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        loadingLogo: {},
        applicationTitle: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using the original OpenSearch loading logo spinner', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        loadingLogo: {},
        applicationTitle: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('logo in dark mode ', () => {
    it('rendered using loading logo dark mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        loadingLogo: { defaultUrl: '/defaultModeLoadingLogo', darkModeUrl: '/darkModeLoadingLogo' },
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using loading logo default mode URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        loadingLogo: { defaultUrl: '/defaultModeLoadingLogo' },
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark dark mode URL with loading bar', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark', darkModeUrl: '/darkModeMark' },
        loadingLogo: {},
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('rendered using mark default mode URL with loading bar', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: { defaultUrl: '/defaultModeMark' },
        loadingLogo: {},
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('renders using original opensearch loading spinner', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        loadingLogo: {},
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });
  });
  describe('render favicon ', () => {
    it('using a valid URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        loadingLogo: {},
        faviconUrl: '/customFavicon',
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });

    it('using an invalid URL', () => {
      const branding = {
        darkMode: false,
        logo: {},
        mark: {},
        loadingLogo: {},
        title: 'custom title',
      };
      injectedMetadata.getBranding.mockReturnValue(branding);
      const component = renderWithIntl(<Template metadata={mockProps()} />);
      expect(component).toMatchSnapshot();
    });
  });
});
