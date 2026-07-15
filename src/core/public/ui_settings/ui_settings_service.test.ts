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

import * as Rx from 'rxjs';
import { schema } from '@osd/config-schema';
import { httpServiceMock } from '../http/http_service.mock';
import { injectedMetadataServiceMock } from '../injected_metadata/injected_metadata_service.mock';
import { UiSettingsService } from './ui_settings_service';
import { UiSettingsApi } from './ui_settings_api';
import { UiSettingScope } from '../../server/ui_settings/types';
import { of } from 'rxjs';

jest.mock('./ui_settings_api');

describe('UiSettingsService', () => {
  const httpSetup = httpServiceMock.createSetupContract();
  const injectedMetadata = injectedMetadataServiceMock.createSetupContract();

  const defaultDeps = {
    http: httpSetup,
    injectedMetadata,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    injectedMetadata.getLegacyMetadata.mockReturnValue({
      uiSettings: {
        defaults: {
          defaultWorkspace: {
            name: 'Default Data Source',
            value: null,
            type: 'string',
            schema: schema.nullable(schema.string()),
          },
        },
        user: {
          defaultWorkspace: {
            userValue: 'TnEacw',
          },
        },
      },
    });

    (UiSettingsApi as jest.Mock).mockImplementation(() => ({
      getLoadingCount$: jest.fn().mockReturnValue(of(0)),
      stop: jest.fn(),
    }));
  });

  describe('#setup', () => {
    it('creates a UiSettingsApi instance per scope plus a default, and registers loadingCount$', () => {
      const service = new UiSettingsService();
      const addLoadingCountSourceSpy = jest.spyOn(defaultDeps.http, 'addLoadingCountSource');

      const client = service.setup(defaultDeps);

      // One scope-less "default" API plus one dedicated API per scope
      // (WORKSPACE, USER, GLOBAL, DASHBOARD_ADMIN).
      expect(UiSettingsApi).toHaveBeenCalledTimes(5);
      expect(UiSettingsApi).toHaveBeenCalledWith(httpSetup);
      expect(UiSettingsApi).toHaveBeenCalledWith(httpSetup, UiSettingScope.WORKSPACE);
      expect(UiSettingsApi).toHaveBeenCalledWith(httpSetup, UiSettingScope.USER);
      expect(UiSettingsApi).toHaveBeenCalledWith(httpSetup, UiSettingScope.GLOBAL);
      expect(UiSettingsApi).toHaveBeenCalledWith(httpSetup, UiSettingScope.DASHBOARD_ADMIN);
      expect(addLoadingCountSourceSpy).toHaveBeenCalledTimes(1);
      expect(client).toBeDefined();
    });
  });

  describe('#start', () => {
    it('returns the initialized uiSettingsClient', () => {
      const service = new UiSettingsService();
      const client = service.setup(defaultDeps);
      const startedClient = service.start();
      expect(startedClient).toBe(client);
    });
  });

  describe('#stop', () => {
    it('runs fine if service never set up', () => {
      const service = new UiSettingsService();
      expect(() => service.stop()).not.toThrowError();
    });

    it('stops the uiSettingsClient and uiSettingsApi', async () => {
      const service = new UiSettingsService();
      let loadingCount$: Rx.Observable<unknown>;
      defaultDeps.http.addLoadingCountSource.mockImplementation((obs$) => (loadingCount$ = obs$));
      const client = service.setup(defaultDeps);

      service.stop();

      await expect(
        Rx.combineLatest(
          client.getUpdate$(),
          client.getSaved$(),
          client.getUpdateErrors$(),
          loadingCount$!
        ).toPromise()
      ).resolves.toBe(undefined);
    });
  });
});
