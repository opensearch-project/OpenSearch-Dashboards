/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../../../core/public';
import { IndexPatternSavedObjectAttrs } from '../../index_patterns/index_patterns';
import { DataSource, DataSourceConfig, IndexPatternOption } from '../datasource';

export class DefaultDslDataSource extends DataSource<
  any,
  any,
  Promise<IndexPatternOption[] | undefined>,
  any,
  any
> {
  private readonly indexPatterns;

  constructor({ name, type, metadata, indexPatterns }: DataSourceConfig) {
    super(name, type, metadata);
    this.indexPatterns = indexPatterns;
  }

  async getDataSet(dataSetParams?: any) {
    await this.indexPatterns.ensureDefaultIndexPattern();
    const savedObjectLst = await this.indexPatterns.getCache();

    if (!Array.isArray(savedObjectLst)) {
      return undefined;
    }

    return savedObjectLst.map((savedObject: SavedObject<IndexPatternSavedObjectAttrs>) => {
      return {
        id: savedObject.id,
        title: savedObject.attributes.title,
      };
    });
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async runQuery(queryParams: any) {
    return undefined;
  }
}
