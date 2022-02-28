/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
        const data = JSON.parse(dom('osd-injected-metadata').attr('data'));

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page for blank basepath', async () => {
        mockRenderingSetupDeps.http.basePath.get.mockReturnValueOnce('');

        const content = await render(createOpenSearchDashboardsRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data'));

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" page driven by settings', async () => {
        uiSettings.getUserProvided.mockResolvedValue({ 'theme:darkMode': { userValue: true } });
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data'));

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" with excluded user settings', async () => {
        const content = await render(createOpenSearchDashboardsRequest(), uiSettings, {
          includeUserSettings: false,
        });
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data'));

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });

      it('renders "core" from legacy request', async () => {
        const content = await render(createRawRequest(), uiSettings);
        const dom = load(content);
        const data = JSON.parse(dom('osd-injected-metadata').attr('data'));

        expect(data).toMatchSnapshot(INJECTED_METADATA);
      });
    });
  });

  describe('isResourceValid()', () => {
    it('checks valid URL', async () => {
      const result = await service.isResourceValid(
        'https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_default.svg',
        'config'
      );
      expect(result).toEqual(true);
    });

    it('checks valid SVG', async () => {
      const result = await service.isResourceValid(
        'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjQgNjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02MS43Mzc0IDIzLjVDNjAuNDg3OCAyMy41IDU5LjQ3NDggMjQuNTEzIDU5LjQ3NDggMjUuNzYyNkM1OS40NzQ4IDQ0LjM4MTMgNDQuMzgxMyA1OS40NzQ4IDI1Ljc2MjYgNTkuNDc0OEMyNC41MTMgNTkuNDc0OCAyMy41IDYwLjQ4NzggMjMuNSA2MS43Mzc0QzIzLjUgNjIuOTg3IDI0LjUxMyA2NCAyNS43NjI2IDY0QzQ2Ljg4MDUgNjQgNjQgNDYuODgwNSA2NCAyNS43NjI2QzY0IDI0LjUxMyA2Mi45ODcgMjMuNSA2MS43Mzc0IDIzLjVaIiBmaWxsPSIjMDA1RUI4Ii8+CjxwYXRoIGQ9Ik00OC4wODE0IDM4QzUwLjI1NzIgMzQuNDUwNSA1Mi4zNjE1IDI5LjcxNzggNTEuOTQ3NSAyMy4wOTIxQzUxLjA4OTkgOS4zNjcyNSAzOC42NTg5IC0xLjA0NDYzIDI2LjkyMDYgMC4wODM3MzI3QzIyLjMyNTMgMC41MjU0NjUgMTcuNjA2OCA0LjI3MTIgMTguMDI2IDEwLjk4MDVDMTguMjA4MiAxMy44OTYxIDE5LjYzNTIgMTUuNjE2OSAyMS45NTQ0IDE2LjkzOTlDMjQuMTYxOCAxOC4xOTkyIDI2Ljk5NzggMTguOTk2OSAzMC4yMTI4IDE5LjkwMTFDMzQuMDk2MiAyMC45OTM0IDM4LjYwMDkgMjIuMjIwMyA0Mi4wNjMgMjQuNzcxN0M0Ni4yMTI1IDI3LjgyOTUgNDkuMDQ5MSAzMS4zNzQzIDQ4LjA4MTQgMzhaIiBmaWxsPSIjMDAzQjVDIi8+CjxwYXRoIGQ9Ik0zLjkxODYxIDE0QzEuNzQyNzYgMTcuNTQ5NSAtMC4zNjE1MDYgMjIuMjgyMiAwLjA1MjQ5MzEgMjguOTA3OUMwLjkxMDA3MiA0Mi42MzI3IDEzLjM0MTEgNTMuMDQ0NiAyNS4wNzk0IDUxLjkxNjNDMjkuNjc0NyA1MS40NzQ1IDM0LjM5MzIgNDcuNzI4OCAzMy45NzQgNDEuMDE5NUMzMy43OTE4IDM4LjEwMzkgMzIuMzY0NyAzNi4zODMxIDMwLjA0NTYgMzUuMDYwMUMyNy44MzgyIDMzLjgwMDggMjUuMDAyMiAzMy4wMDMxIDIxLjc4NzIgMzIuMDk4OUMxNy45MDM4IDMxLjAwNjYgMTMuMzk5MSAyOS43Nzk3IDkuOTM2OTQgMjcuMjI4M0M1Ljc4NzQ2IDI0LjE3MDQgMi45NTA5MiAyMC42MjU3IDMuOTE4NjEgMTRaIiBmaWxsPSIjMDA1RUI4Ii8+Cjwvc3ZnPgo=',
        'config'
      );
      expect(result).toEqual(true);
    });

    it('checks invalid resource', async () => {
      const result = await service.isResourceValid('some garbage', 'config');
      expect(result).toEqual(false);
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
