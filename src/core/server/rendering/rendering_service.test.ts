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

import { load } from 'cheerio';
import { i18nLoader } from '@osd/i18n';

jest.mock('@osd/i18n', () => {
  const originalModule = jest.requireActual('@osd/i18n');
  return {
    ...originalModule,
    i18nLoader: {
      getRegisteredLocales: jest.fn(),
      getTranslationsByLocale: jest.fn(),
      isRegisteredLocale: jest.fn(),
    },
  };
});

const i18nLoaderMock = jest.mocked(i18nLoader, true);

import { httpServerMock } from '../http/http_server.mocks';
import { uiSettingsServiceMock } from '../ui_settings/ui_settings_service.mock';
import { mockRenderingSetupDeps } from './__mocks__/params';
import { InternalRenderingServiceSetup } from './types';
import { RenderingService } from './rendering_service';
import { configServiceMock } from '../config/mocks';
import { BehaviorSubject } from 'rxjs';
import { config as RawOpenSearchDashboardsConfig } from '../opensearch_dashboards_config';
import { mockCoreContext } from '../core_context.mock';

const INJECTED_METADATA = {
  version: expect.any(String),
  branch: expect.any(String),
  buildNumber: expect.any(Number),
  env: {
    mode: {
      name: expect.any(String),
      dev: expect.any(Boolean),
      prod: expect.any(Boolean),
    },
    packageInfo: {
      branch: expect.any(String),
      buildNum: expect.any(Number),
      buildSha: expect.any(String),
      dist: expect.any(Boolean),
      version: expect.any(String),
    },
  },
};

const { createOpenSearchDashboardsRequest, createRawRequest } = httpServerMock;

describe('RenderingService', () => {
  let service: RenderingService;
  const configService = configServiceMock.create();
  configService.atPath.mockImplementation(() => {
    return new BehaviorSubject(RawOpenSearchDashboardsConfig.schema.validate({}));
  });
  const context = mockCoreContext.create({ configService });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RenderingService(context);
  });

  describe('setup()', () => {
    describe('render()', () => {
      let uiSettings: ReturnType<typeof uiSettingsServiceMock.createClient>;
      let render: InternalRenderingServiceSetup['render'];

      beforeEach(async () => {
        uiSettings = uiSettingsServiceMock.createClient();
        uiSettings.getRegistered.mockReturnValue({
          registered: { name: 'title' },
        });
        render = (await service.setup(mockRenderingSetupDeps)).render;
      });

      it('renders "core" page', async () => {
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page for blank basepath', async () => {
        mockRenderingSetupDeps.http.basePath.get.mockReturnValueOnce('');

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by configured defaults', async () => {
        // Defaults: Y, User: N, Overrides: N, themeTag: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue({});

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v7');
      });

      it('renders "core" page driven by user settings', async () => {
        // Defaults: Y, User: Y, Overrides: N, themeTag: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('light');
        expect($elStyle.attr('data-theme')).toBe('v8');
      });

      it('renders "core" page driven by configured overrides', async () => {
        // Defaults: Y, User: N, Overrides: Y, themeTag: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('light');
        expect($elStyle.attr('data-theme')).toBe('v8');
      });

      it('renders "core" page driven by configured theme-tag', async () => {
        // Defaults: Y, User: N, Overrides: N, themeTag: Y
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue({});

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'v9light' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('light');
        expect($elStyle.attr('data-theme')).toBe('v9');
      });

      it('renders "core" page driven by theme-tag despite user settings', async () => {
        // Defaults: Y, User: Y, Overrides: N, themeTag: Y
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'v9dark' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v9');
      });

      it('renders "core" page driven by configured overrides despite user settings', async () => {
        // Defaults: Y, User: Y, Overrides: Y
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v9',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v9');
      });

      it('renders "core" page driven by configured overrides despite theme-tag', async () => {
        // Defaults: Y, User: Y, Overrides: Y
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v9',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'v7light' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v9');
      });

      it('renders "core" page using defaults when user setting is invalid', async () => {
        // Defaults: Y, User: INVALID, Overrides: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': undefined,
          'theme:version': 'invalid',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v7');
      });

      it('renders "core" page using defaults when configured override in invalid', async () => {
        // Defaults: Y, User: N, Overrides: INVALID
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': undefined,
          'theme:version': 'invalid',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v7');
      });

      it('renders "core" page using defaults when configured override in invalid despite user settings', async () => {
        // Defaults: Y, User: Y, Overrides: INVALID
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': undefined,
          'theme:version': 'invalid',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {});
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('light');
        expect($elStyle.attr('data-theme')).toBe('v7');
      });

      it('renders "core" page driven by configured defaults when theme-tag is invalid', async () => {
        // Defaults: Y, User: N, Overrides: N, themeTag: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue({});

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'invalid' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v7');
      });

      it('renders "core" page driven by user settings when theme-tag is invalid', async () => {
        // Defaults: Y, User: Y, Overrides: N, themeTag: N
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => defaultsConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'invalid' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('light');
        expect($elStyle.attr('data-theme')).toBe('v8');
      });

      it('renders "core" page driven by configured overrides despite an invalid theme-tag', async () => {
        // Defaults: Y, User: Y, Overrides: Y
        const defaultsConfig: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v7',
        };
        const userSettings: Record<string, unknown> = {
          'theme:darkMode': false,
          'theme:version': 'v8',
        };
        const overridesConfig: Record<string, unknown> = {
          'theme:darkMode': true,
          'theme:version': 'v9',
        };
        uiSettings.getOverrideOrDefault.mockImplementation((name) => overridesConfig[name]);
        uiSettings.getRegistered.mockReturnValue(
          Object.keys(defaultsConfig).reduce(
            (acc, key) => ({ ...acc, [key]: { value: defaultsConfig[key] } }),
            {}
          )
        );
        uiSettings.getUserProvided.mockResolvedValue(
          Object.keys(userSettings).reduce(
            (acc, key) => ({ ...acc, [key]: { userValue: userSettings[key] } }),
            {}
          )
        );
        uiSettings.isOverridden.mockImplementation((name) => name in overridesConfig);

        const content = await render(
          createOpenSearchDashboardsRequest({ query: { themeTag: 'invalid' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('style[data-theme][data-color-scheme]');

        expect($elStyle.attr('data-color-scheme')).toBe('dark');
        expect($elStyle.attr('data-theme')).toBe('v9');
      });

      it('renders "core" page driven by defaults', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: false } });
        uiSettings.getOverrideOrDefault.mockImplementation((name) => name === 'theme:darkMode');
        uiSettings.getRegistered.mockReturnValue({ 'theme:darkMode': { value: true } });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(uiSettings.getUserProvided).not.toHaveBeenCalled();
        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by settings', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: true } });
        uiSettings.getRegistered.mockReturnValue({ 'theme:darkMode': { value: false } });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page with no defaults or overrides', async () => {
        uiSettings.getUserProvided.mockResolvedValue({});
        uiSettings.getOverrideOrDefault.mockImplementation((name) =>
          name === 'theme:darkMode' ? undefined : false
        );
        uiSettings.getRegistered.mockReturnValue({});
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(uiSettings.getUserProvided).not.toHaveBeenCalled();
        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" with excluded user settings', async () => {
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" from legacy request', async () => {
        const content = await render(createRawRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by overridden locale', async () => {
        i18nLoaderMock.isRegisteredLocale.mockReturnValue(true);
        const content = await render(
          createOpenSearchDashboardsRequest({ query: { locale: 'TR-tr' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('html');

        expect(i18nLoader.isRegisteredLocale).toHaveBeenCalledWith('tr-TR');
        expect($elStyle.attr('lang')).toBe('tr-TR');
      });

      it('renders "core" page driven by invalid overridden locale', async () => {
        i18nLoaderMock.isRegisteredLocale.mockReturnValue(false);
        const content = await render(
          createOpenSearchDashboardsRequest({ query: { locale: 'xx-XX' } }),
          uiSettings,
          {}
        );
        const dom = load(content);
        const $elStyle = dom('html');

        expect(i18nLoader.isRegisteredLocale).toHaveBeenCalledWith('xx-XX');
        expect($elStyle.attr('lang')).toBe('en');
      });
    });
  });

  describe('isUrlValid()', () => {
    it('checks valid SVG URL', async () => {
      const result = await service.isUrlValid(
        'https://opensearch.org/wp-content/uploads/2025/01/opensearch_logo_default.svg',
        'config'
      );
      expect(result).toEqual(true);
    });

    it('checks valid PNG URL', async () => {
      const result = await service.isUrlValid(
        'https://opensearch.org/wp-content/uploads/2025/01/opensearch_logo_default.png',
        'config'
      );
      expect(result).toEqual(true);
    });

    it('checks invalid URL that does not contain svg, png or gif', async () => {
      const result = await service.isUrlValid('https://validUrl', 'config');
      expect(result).toEqual(false);
    });

    it('checks invalid URL', async () => {
      const result = await service.isUrlValid('http://notfound.svg', 'config');
      expect(result).toEqual(false);
    });

    it('checks default URL returns false', async () => {
      const result = await service.isUrlValid('/', 'config');
      expect(result).toEqual(false);
    });

    it('checks relative URL returns true', async () => {
      const result = await service.isUrlValid('/demo/opensearch_mark_default.png', 'config');
      expect(result).toEqual(true);
    });
  });

  describe('isTitleValid()', () => {
    it('checks valid title', () => {
      const result = service.isTitleValid('OpenSearch Dashboards', 'config');
      expect(result).toEqual(true);
    });

    it('checks invalid title with empty string', () => {
      const result = service.isTitleValid('', 'config');
      expect(result).toEqual(false);
    });

    it('checks invalid title with length > 36 character', () => {
      const result = service.isTitleValid('OpenSearch Dashboardssssssssssssssssssssss', 'config');
      expect(result).toEqual(false);
    });
  });
});
