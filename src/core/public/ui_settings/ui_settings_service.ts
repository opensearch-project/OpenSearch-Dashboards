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

import { Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpSetup } from '../http';
import { InjectedMetadataSetup } from '../injected_metadata';

import { UiSettingsApi } from './ui_settings_api';
import { UiSettingsClient } from './ui_settings_client';
import { IUiSettingsClient } from './types';
import { UiSettingScope } from '../../server/ui_settings/types';

export interface UiSettingsServiceDeps {
  http: HttpSetup;
  injectedMetadata: InjectedMetadataSetup;
}

/** @internal */
export class UiSettingsService {
  private uiSettingApis?: Record<string, UiSettingsApi>;
  private uiSettingsClient?: UiSettingsClient;
  private done$ = new Subject();

  public setup({ http, injectedMetadata }: UiSettingsServiceDeps): IUiSettingsClient {
    /**
     * Currently, we have three scopes: workspace, global, and user.
     * For workspace and user and global, we instantiate a dedicated API to handle operations specific to that scope.
     * if the scope is not clarified, it will remains the previous logic, leave the handling to server to decide the destinanted scope
     */
    this.uiSettingApis = {
      default: new UiSettingsApi(http),
      [UiSettingScope.WORKSPACE]: new UiSettingsApi(http, UiSettingScope.WORKSPACE),
      [UiSettingScope.USER]: new UiSettingsApi(http, UiSettingScope.USER),
      [UiSettingScope.GLOBAL]: new UiSettingsApi(http, UiSettingScope.GLOBAL),
    };

    const combinedLoadingCount$ = combineLatest(
      Object.values(this.uiSettingApis).map((api) => api.getLoadingCount$())
    ).pipe(map((counts) => counts.reduce((sum, count) => sum + count, 0)));

    http.addLoadingCountSource(combinedLoadingCount$);

    // TODO: Migrate away from legacyMetadata https://github.com/elastic/kibana/issues/22779
    const legacyMetadata = injectedMetadata.getLegacyMetadata();

    this.uiSettingsClient = new UiSettingsClient({
      uiSettingApis: this.uiSettingApis,
      defaults: legacyMetadata.uiSettings.defaults,
      initialSettings: legacyMetadata.uiSettings.user,
      done$: this.done$,
    });

    return this.uiSettingsClient;
  }

  public start(): IUiSettingsClient {
    return this.uiSettingsClient!;
  }

  public stop() {
    this.done$.complete();

    if (this.uiSettingApis) {
      for (const api of Object.values(this.uiSettingApis)) {
        api.stop();
      }
    }
  }
}
