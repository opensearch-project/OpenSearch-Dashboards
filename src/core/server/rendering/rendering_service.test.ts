/** @jest-environment node */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
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

const i18nLoaderMock = jest.mocked(i18nLoader, { shallow: true });

import { httpServerMock } from '../http/http_server.mocks';
import { uiSettingsServiceMock } from '../ui_settings/ui_settings_service.mock';
import { mockRenderingSetupDeps } from './__mocks__/params';
import { InternalRenderingServiceSetup } from './types';
import { RenderingService } from './rendering_service';
import { configServiceMock } from '../config/mocks';
import { BehaviorSubject } from 'rxjs';
import { config as RawOpenSearchDashboardsConfig } from '../opensearch_dashboards_config';
import { mockCoreContext } from '../core_context.mock';
import { dynamicConfigServiceMock } from '../config/dynamic_config_service.mock';
import { UiPlugins } from '../plugins';

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
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page for blank basepath', async () => {
        mockRenderingSetupDeps.http.basePath.get.mockReturnValueOnce('');

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by defaults', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: false } });
        uiSettings.getOverrideOrDefault.mockImplementation((name) => name === 'theme:darkMode');
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(uiSettings.getUserProvided).not.toHaveBeenCalled();
        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by settings', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: true } });
        uiSettings.getRegistered.mockReturnValue({ 'theme:darkMode': { value: false } });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page with no defaults or overrides', async () => {
        uiSettings.getUserProvided.mockResolvedValue({});
        uiSettings.getOverrideOrDefault.mockImplementation((name) =>
          name === 'theme:darkMode' ? undefined : false
        );
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(uiSettings.getUserProvided).not.toHaveBeenCalled();
        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" with excluded user settings', async () => {
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" from legacy request', async () => {
        const content = await render(createRawRequest(), uiSettings, {
          nonce: 'test-nonce',
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data') || '');

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by overridden locale', async () => {
        i18nLoaderMock.isRegisteredLocale.mockReturnValue(true);
        const content = await render(
          createOpenSearchDashboardsRequest({ query: { locale: 'TR-tr' } }),
          uiSettings,
          { nonce: 'test-nonce' }
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
          { nonce: 'test-nonce' }
        );
        const dom = load(content);
        const $elStyle = dom('html');

        expect(i18nLoader.isRegisteredLocale).toHaveBeenCalledWith('xx-XX');
        expect($elStyle.attr('lang')).toBe('en');
      });
    });

    describe('render() plugin config exposure', () => {
      const SERVER_ONLY_VALUE = 'server-only-value';

      const discoveredPlugin = (id: string, configPath: string) => ({
        id,
        configPath,
        requiredPlugins: [],
        optionalPlugins: [],
        requiredBundles: [],
        requiredEnginePlugins: {},
      });

      const dynamicConfigs: Record<string, Record<string, unknown>> = {
        // configPath equals snake_case(id): the dynamic service knows it by either identifier.
        default_path: { enabled: true, exposedProp: 'dynamic exposed', serverOnly: SERVER_ONLY_VALUE },
        // custom configPath: the dynamic service knows it ONLY by configPath.
        custom_path: { enabled: true, exposedProp: 'dynamic exposed', serverOnly: SERVER_ONLY_VALUE },
        // declares nothing in exposeToBrowser.
        undeclared_path: { enabled: false, serverOnly: SERVER_ONLY_VALUE },
      };

      let getConfig: jest.Mock;
      let uiPluginsFixture: UiPlugins;
      let uiSettings: ReturnType<typeof uiSettingsServiceMock.createClient>;

      const renderPluginConfigs = async () => {
        const dynamicConfig = dynamicConfigServiceMock.createInternalSetupContract();
        dynamicConfig.getStartService.mockResolvedValue({
          getClient: () => ({ getConfig, bulkGetConfigs: jest.fn(), listConfigs: jest.fn() }),
          getAsyncLocalStore: () => new Map(),
          createStoreFromRequest: () => new Map(),
        } as any);

        const { render } = await service.setup({
          ...mockRenderingSetupDeps,
          uiPlugins: uiPluginsFixture,
          dynamicConfig,
        });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          nonce: 'test-nonce',
        });
        const data = JSON.parse(load(content)('osd-injected-metadata').attr('data') || '');
        return Object.fromEntries(
          (data.uiPlugins as Array<{ id: string; config: unknown }>).map((p) => [p.id, p.config])
        );
      };

      beforeEach(() => {
        uiSettings = uiSettingsServiceMock.createClient();
        uiSettings.getRegistered.mockReturnValue({});

        getConfig = jest.fn(async (identifier: { name?: string; pluginConfigPath?: string }) => {
          const path = identifier.pluginConfigPath ?? identifier.name!;
          if (!(path in dynamicConfigs)) {
            throw new Error(`no dynamic config for ${path}`);
          }
          return dynamicConfigs[path];
        });

        uiPluginsFixture = {
          internal: new Map(),
          public: new Map([
            ['defaultPath', discoveredPlugin('defaultPath', 'default_path')],
            ['customPath', discoveredPlugin('customPath', 'custom_path')],
            ['undeclared', discoveredPlugin('undeclared', 'undeclared_path')],
          ]),
          browserConfigs: new Map([
            ['defaultPath', new BehaviorSubject({ exposedProp: 'static exposed' })],
            ['customPath', new BehaviorSubject({ exposedProp: 'static exposed' })],
          ]),
          exposedConfigKeys: new Map([
            ['defaultPath', ['exposedProp']],
            ['customPath', ['exposedProp']],
            ['undeclared', []],
          ]),
        } as any;
      });

      it('resolves plugins through the dynamic config service by configPath, not plugin id', async () => {
        // The dynamic config service only knows the plugin by its configPath; resolving by
        // snake_case(id) would miss `customPath` and silently fall back to static config.
        context.dynamicConfigService.hasDefaultConfigs.mockImplementation(
          (identifier: any) => identifier.pluginConfigPath in dynamicConfigs
        );

        const configs = await renderPluginConfigs();

        expect(context.dynamicConfigService.hasDefaultConfigs).toHaveBeenCalledWith({
          pluginConfigPath: 'custom_path',
        });
        expect(getConfig).toHaveBeenCalledWith(
          { pluginConfigPath: 'custom_path' },
          expect.anything()
        );
        expect(configs.customPath).toEqual({ exposedProp: 'dynamic exposed' });
        expect(configs.defaultPath).toEqual({ exposedProp: 'dynamic exposed' });
      });

      it('restricts dynamic config to the keys declared in exposeToBrowser', async () => {
        context.dynamicConfigService.hasDefaultConfigs.mockReturnValue(true);

        const configs = await renderPluginConfigs();

        for (const id of ['defaultPath', 'customPath']) {
          expect(configs[id]).toEqual({ exposedProp: 'dynamic exposed' });
          expect(configs[id]).not.toHaveProperty('serverOnly');
          expect(configs[id]).not.toHaveProperty('enabled');
        }
      });

      it('restricts static config to the keys declared in exposeToBrowser', async () => {
        context.dynamicConfigService.hasDefaultConfigs.mockReturnValue(false);

        const configs = await renderPluginConfigs();

        // No plugin config is read through the dynamic client on the static path. The
        // render path makes unrelated core lookups (e.g. opensearchDashboards), so match
        // on the plugin config paths rather than asserting zero calls.
        for (const path of ['default_path', 'custom_path', 'undeclared_path']) {
          expect(getConfig).not.toHaveBeenCalledWith(
            expect.objectContaining({ pluginConfigPath: path }),
            expect.anything()
          );
        }
        expect(configs.defaultPath).toEqual({ exposedProp: 'static exposed' });
        expect(configs.customPath).toEqual({ exposedProp: 'static exposed' });
      });

      it('sends an empty config for plugins that declare nothing, without reading their config', async () => {
        context.dynamicConfigService.hasDefaultConfigs.mockReturnValue(true);

        const configs = await renderPluginConfigs();

        expect(configs.undeclared).toEqual({});
        expect(getConfig).not.toHaveBeenCalledWith(
          expect.objectContaining({ pluginConfigPath: 'undeclared_path' }),
          expect.anything()
        );
      });

      it('never serializes a server-only value to the page, from either config source', async () => {
        context.dynamicConfigService.hasDefaultConfigs.mockImplementation(
          (identifier: any) => identifier.pluginConfigPath === 'custom_path'
        );

        const dynamicConfig = dynamicConfigServiceMock.createInternalSetupContract();
        dynamicConfig.getStartService.mockResolvedValue({
          getClient: () => ({ getConfig, bulkGetConfigs: jest.fn(), listConfigs: jest.fn() }),
          getAsyncLocalStore: () => new Map(),
          createStoreFromRequest: () => new Map(),
        } as any);
        const { render } = await service.setup({
          ...mockRenderingSetupDeps,
          uiPlugins: uiPluginsFixture,
          dynamicConfig,
        });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          nonce: 'test-nonce',
        });

        expect(content).not.toContain(SERVER_ONLY_VALUE);
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
