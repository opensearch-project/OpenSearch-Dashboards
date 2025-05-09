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
  private uiSettingsApi?: UiSettingsApi;
  private uiSettingsApiForWorkspace?: UiSettingsApi;
  private uiSettingsApiForUser?: UiSettingsApi;
  private uiSettingsClient?: UiSettingsClient;
  private done$ = new Subject();

  public setup({ http, injectedMetadata }: UiSettingsServiceDeps): IUiSettingsClient {
    /**
     * Currently, we have three scopes: workspace, global, and user.
     * For workspace and user, we instantiate a dedicated API to handle operations specific to that scope.
     * If the scope is not explicitly specified, the logic falls back to the previous behavior — leaving it to the server to determine the destination scope.
     */
    this.uiSettingsApi = new UiSettingsApi(http);
    this.uiSettingsApiForWorkspace = new UiSettingsApi(http, UiSettingScope.WORKSPACE);
    this.uiSettingsApiForUser = new UiSettingsApi(http, UiSettingScope.USER);

    const combinedLoadingCount$ = combineLatest([
      this.uiSettingsApi.getLoadingCount$(),
      this.uiSettingsApiForWorkspace.getLoadingCount$(),
      this.uiSettingsApiForUser.getLoadingCount$(),
    ]).pipe(
      map(([globalCount, workspaceCount, userCount]) => globalCount + workspaceCount + userCount)
    );
    http.addLoadingCountSource(combinedLoadingCount$);

    // TODO: Migrate away from legacyMetadata https://github.com/elastic/kibana/issues/22779
    const legacyMetadata = injectedMetadata.getLegacyMetadata();

    this.uiSettingsClient = new UiSettingsClient({
      api: this.uiSettingsApi,
      defaults: legacyMetadata.uiSettings.defaults,
      initialSettings: legacyMetadata.uiSettings.user,
      done$: this.done$,
      apiForWorkspace: this.uiSettingsApiForWorkspace,
      apiForUser: this.uiSettingsApiForUser,
    });

    return this.uiSettingsClient;
  }

  public start(): IUiSettingsClient {
    return this.uiSettingsClient!;
  }

  public stop() {
    this.done$.complete();

    if (this.uiSettingsApi) {
      this.uiSettingsApi.stop();
    }
    if (this.uiSettingsApiForWorkspace) {
      this.uiSettingsApiForWorkspace.stop();
    }
    if (this.uiSettingsApiForUser) {
      this.uiSettingsApiForUser.stop();
    }
  }
}
