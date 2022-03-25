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

import { ToolingLog } from '../tooling_log';
import { OsdClientRequester, ReqOptions } from './osd_client_requester';
import { OsdClientStatus } from './osd_client_status';
import { OsdClientPlugins } from './osd_client_plugins';
import { OsdClientVersion } from './osd_client_version';
import { OsdClientSavedObjects } from './osd_client_saved_objects';
import { OsdClientUiSettings, UiSettingValues } from './osd_client_ui_settings';

export interface OsdClientOptions {
  url: string;
  certificateAuthorities?: Buffer[];
  log: ToolingLog;
  uiSettingDefaults?: UiSettingValues;
}

export class OsdClient {
  readonly status: OsdClientStatus;
  readonly plugins: OsdClientPlugins;
  readonly version: OsdClientVersion;
  readonly savedObjects: OsdClientSavedObjects;
  readonly uiSettings: OsdClientUiSettings;

  private readonly requester: OsdClientRequester;
  private readonly log: ToolingLog;
  private readonly uiSettingDefaults?: UiSettingValues;

  /**
   * Basic OpenSearch Dashboards server client that implements common behaviors for talking
   * to the OpenSearch Dashboards server from dev tooling.
   */
  constructor(options: OsdClientOptions) {
    if (!options.url) {
      throw new Error('missing OpenSearch Dashboards url');
    }
    if (!options.log) {
      throw new Error('missing ToolingLog');
    }

    this.log = options.log;
    this.uiSettingDefaults = options.uiSettingDefaults;

    this.requester = new OsdClientRequester(this.log, {
      url: options.url,
      certificateAuthorities: options.certificateAuthorities,
    });
    this.status = new OsdClientStatus(this.requester);
    this.plugins = new OsdClientPlugins(this.status);
    this.version = new OsdClientVersion(this.status);
    this.savedObjects = new OsdClientSavedObjects(this.log, this.requester);
    this.uiSettings = new OsdClientUiSettings(this.log, this.requester, this.uiSettingDefaults);
  }

  /**
   * Make a direct request to the OpenSearch Dashboards server
   */
  async request<T>(options: ReqOptions) {
    return await this.requester.request<T>(options);
  }

  resolveUrl(relativeUrl: string) {
    return this.requester.resolveUrl(relativeUrl);
  }
}
