/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { IDataView, IFieldType } from 'src/plugins/data/public';
import { SimpleSavedObject } from 'src/core/public';

export interface DatasetTag {
  key: string;
  name: string;
}

const defaultDatasetListName = i18n.translate(
  'datasetManagement.editDataset.list.defaultDatasetListName',
  {
    defaultMessage: 'Default',
  }
);

export class DatasetListConfig {
  public readonly key = 'default';

  public getDatasetTags(
    dataset: IDataView | SimpleSavedObject<IDataView>,
    isDefault: boolean
  ): DatasetTag[] {
    return isDefault
      ? [
          {
            key: 'default',
            name: defaultDatasetListName,
          },
        ]
      : [];
  }

  public getFieldInfo(dataset: IDataView, field: IFieldType): string[] {
    return [];
  }

  public areScriptedFieldsEnabled(dataset: IDataView): boolean {
    return true;
  }
}
