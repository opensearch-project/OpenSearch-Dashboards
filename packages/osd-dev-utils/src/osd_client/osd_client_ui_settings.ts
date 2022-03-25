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

import { OsdClientRequester, uriencode } from './osd_client_requester';

export type UiSettingValues = Record<string, string | number | boolean>;
interface UiSettingsApiResponse {
  settings: {
    [key: string]: {
      userValue: string | number | boolean;
      isOverridden: boolean | undefined;
    };
  };
}

export class OsdClientUiSettings {
  constructor(
    private readonly log: ToolingLog,
    private readonly requester: OsdClientRequester,
    private readonly defaults?: UiSettingValues
  ) {}

  async get(setting: string) {
    const all = await this.getAll();
    const value = all[setting]?.userValue;

    this.log.verbose('uiSettings.value: %j', value);
    return value;
  }

  /**
   * Gets defaultIndex from the config doc.
   */
  async getDefaultIndex() {
    return await this.get('defaultIndex');
  }

  /**
   * Unset a uiSetting
   */
  async unset(setting: string) {
    const { data } = await this.requester.request<any>({
      path: uriencode`/api/opensearch-dashboards/settings/${setting}`,
      method: 'DELETE',
    });
    return data;
  }

  /**
   * Replace all uiSettings with the `doc` values, `doc` is merged
   * with some defaults
   */
  async replace(doc: UiSettingValues, { retries = 5 }: { retries?: number } = {}) {
    this.log.debug('replacing opensearch-dashboards config doc: %j', doc);

    const changes: Record<string, any> = {
      ...this.defaults,
      ...doc,
    };

    for (const [name, { isOverridden }] of Object.entries(await this.getAll())) {
      if (!isOverridden && !changes.hasOwnProperty(name)) {
        changes[name] = null;
      }
    }

    await this.requester.request({
      method: 'POST',
      path: '/api/opensearch-dashboards/settings',
      body: { changes },
      retries,
    });
  }

  /**
   * Add fields to the config doc (like setting timezone and defaultIndex)
   */
  async update(updates: UiSettingValues) {
    this.log.debug('applying update to opensearch-dashboards config: %j', updates);

    await this.requester.request({
      path: '/api/opensearch-dashboards/settings',
      method: 'POST',
      body: {
        changes: updates,
      },
      retries: 3,
    });
  }

  private async getAll() {
    const { data } = await this.requester.request<UiSettingsApiResponse>({
      path: '/api/opensearch-dashboards/settings',
      method: 'GET',
    });

    return data.settings;
  }
}
