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

import { IDataView, IFieldType } from 'src/plugins/data/public';
import { SimpleSavedObject } from 'src/core/public';
import { DatasetListConfig, DatasetTag } from './config';

export class DatasetListManager {
  private configs: DatasetListConfig[] = [];

  setup() {
    return {
      addListConfig: (Config: typeof DatasetListConfig) => {
        const config = new Config();

        if (this.configs.findIndex((c) => c.key === config.key) !== -1) {
          throw new Error(`${config.key} exists in DatasetListManager.`);
        }
        this.configs.push(config);
      },
    };
  }

  start() {
    return {
      getDatasetTags: (dataset: IDataView | SimpleSavedObject<IDataView>, isDefault: boolean) =>
        this.configs.reduce(
          (tags: DatasetTag[], config) =>
            config.getDatasetTags ? tags.concat(config.getDatasetTags(dataset, isDefault)) : tags,
          []
        ),

      getFieldInfo: (dataset: IDataView, field: IFieldType): string[] =>
        this.configs.reduce(
          (info: string[], config) =>
            config.getFieldInfo ? info.concat(config.getFieldInfo(dataset, field)) : info,
          []
        ),

      areScriptedFieldsEnabled: (dataset: IDataView): boolean =>
        this.configs.every((config) =>
          config.areScriptedFieldsEnabled ? config.areScriptedFieldsEnabled(dataset) : true
        ),
    };
  }
}
