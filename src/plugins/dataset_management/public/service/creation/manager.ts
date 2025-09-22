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

import { HttpSetup } from '../../../../../core/public';
import { DatasetCreationConfig, UrlHandler, DatasetCreationOption } from './config';

export class DatasetCreationManager {
  private configs: DatasetCreationConfig[] = [];

  setup(httpClient: HttpSetup) {
    return {
      addCreationConfig: (Config: typeof DatasetCreationConfig) => {
        const config = new Config({ httpClient });

        if (this.configs.findIndex((c) => c.key === config.key) !== -1) {
          throw new Error(`${config.key} exists in DatasetCreationManager.`);
        }

        this.configs.push(config);
      },
    };
  }

  start() {
    const getType = (key: string | undefined): DatasetCreationConfig => {
      if (key) {
        const index = this.configs.findIndex((config) => config.key === key);
        const config = this.configs[index];

        if (config) {
          return config;
        } else {
          throw new Error(`Index pattern creation type not found: ${key}`);
        }
      } else {
        return getType('default');
      }
    };

    return {
      getType,
      getDatasetCreationOptions: async (urlHandler: UrlHandler) => {
        const options: DatasetCreationOption[] = [];

        await Promise.all(
          this.configs.map(async (config) => {
            const option = config.getDatasetCreationOption
              ? await config.getDatasetCreationOption(urlHandler)
              : null;
            if (option) {
              options.push(option);
            }
          })
        );

        return options;
      },
    };
  }
}
