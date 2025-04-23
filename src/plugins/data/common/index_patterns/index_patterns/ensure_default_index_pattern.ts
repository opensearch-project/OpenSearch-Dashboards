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

import { IndexPatternsContract } from './index_patterns';
import { SavedObjectsClientCommon, UiSettingsCommon } from '../types';
export type EnsureDefaultIndexPattern = () => Promise<unknown | void> | undefined;
export const createEnsureDefaultIndexPattern = (
  uiSettings: UiSettingsCommon,
  onRedirectNoIndexPattern: () => Promise<unknown> | void,
  canUpdateUiSetting?: boolean,
  savedObjectsClient?: SavedObjectsClientCommon
) => {
  /**
   * Checks whether a default index pattern is set and exists and defines
   * one otherwise.
   */
  return async function ensureDefaultIndexPattern(this: IndexPatternsContract) {
    if (canUpdateUiSetting === false) {
      return;
    }
    const defaultId = await uiSettings.get('defaultIndex');
    const defined = !!defaultId;
    const patterns: string[] = [];
    if (defined) {
      const indexPattern = await this.get(defaultId);
      const dataSourceRef = indexPattern?.dataSourceRef;
      if (dataSourceRef) {
        const result = await this.getDataSource(dataSourceRef.id);
        if (result.error?.statusCode === 403 || result.error?.statusCode === 404) {
          try {
            if (savedObjectsClient) {
              const datasources = await savedObjectsClient.find({ type: 'data-source' });
              const indexPatterns = await savedObjectsClient.find({ type: 'index-pattern' });
              const existDataSources = datasources.map((item) => item.id);
              indexPatterns.forEach((item) => {
                const refId = item.references?.[0]?.id;
                const refIdBool = !!refId;
                if (!refIdBool || existDataSources.includes(refId)) {
                  patterns.push(item.id);
                }
              });
            }
          } catch (e) {
            //  if it fails, jump directly to the execution of Redirect
          }
        } else {
          return;
        }
      } else {
        return;
      }
    }
    if (patterns.length >= 1) {
      await uiSettings.set('defaultIndex', patterns[0]);
    } else {
      const isEnhancementsEnabled = await uiSettings.get('query:enhancements:enabled');
      const shouldRedirect = !isEnhancementsEnabled;
      if (shouldRedirect) return onRedirectNoIndexPattern();
      else return;
    }
  };
};
