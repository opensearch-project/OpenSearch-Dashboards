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

import { includes } from 'lodash';
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
    let patterns = await this.getIds();
    let defaultId = await uiSettings.get('defaultIndex');
    let defined = !!defaultId;
    const exists = includes(patterns, defaultId);

    if (defined && !exists) {
      await uiSettings.remove('defaultIndex');
      defaultId = defined = false;
    }

    if (defined) {
      const indexPattern = await this.get(defaultId);
      const dataSourceRef = indexPattern?.dataSourceRef;
      if (!dataSourceRef) {
        return;
      }
      let isDefaultIndexPatternReferenceValid = true;

      if (!dataSourceRef.id) {
        isDefaultIndexPatternReferenceValid = false;
      } else {
        try {
          const result = await this.getDataSource(dataSourceRef.id);
          isDefaultIndexPatternReferenceValid = !(
            result.error?.statusCode === 403 || result.error?.statusCode === 404
          );
        } catch (e) {
          // The logic below for updating the default index pattern only handles cases where the data source is not found or the user lacks access permissions
          // For other unexpected errors, we simply return to prevent infinite loops when updating the default index pattern.
          return;
        }
      }

      if (!isDefaultIndexPatternReferenceValid) {
        try {
          if (savedObjectsClient) {
            const datasources = await savedObjectsClient.find({ type: 'data-source' });
            const indexPatterns = await savedObjectsClient.find({ type: 'index-pattern' });
            const existDataSources = datasources.map((item) => item.id);
            patterns = [];
            indexPatterns.forEach((item) => {
              const sourceRef = item.references?.find((ref) => ref.type === 'data-source');
              let isDataSourceReferenceValid = false;
              /**
               * The reference is valid when either:
               * 1. No data source is referenced (using local cluster, which must be available for OpenSearch Dashboards to function)
               * 2. A data source is referenced with a valid ID
               */
              if (!sourceRef) {
                isDataSourceReferenceValid = true;
              }

              if (sourceRef?.id && existDataSources.includes(sourceRef.id)) {
                isDataSourceReferenceValid = true;
              }

              if (isDataSourceReferenceValid) {
                patterns.push(item.id);
              }
            });
          }
        } catch (e) {
          return;
        }
      } else {
        return;
      }
    }

    // If there is any index pattern created, set the first as default
    if (patterns.length >= 1) {
      defaultId = patterns[0];
      await uiSettings.set('defaultIndex', defaultId);
    } else {
      const isEnhancementsEnabled = await uiSettings.get('query:enhancements:enabled');
      const shouldRedirect = !isEnhancementsEnabled;
      if (shouldRedirect) return onRedirectNoIndexPattern();
      else return;
    }
  };
};
