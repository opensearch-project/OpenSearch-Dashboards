/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
