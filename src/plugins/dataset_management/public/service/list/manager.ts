/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
