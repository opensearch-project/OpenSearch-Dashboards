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

      it('renders "core" page driven by defaults', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: false } });
        uiSettings.getOverrideOrDefault.mockImplementation((name) => name === 'theme:darkMode');
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
    });
  });

  describe('isUrlValid()', () => {
    it('checks valid SVG URL', async () => {
      const result = await service.isUrlValid(
        'https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_default.svg',
        'config'
      );
      expect(result).toEqual(true);
    });

    it('checks valid PNG URL', async () => {
      const result = await service.isUrlValid(
        'https://opensearch.org/assets/brand/PNG/Mark/opensearch_mark_default.png',
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
