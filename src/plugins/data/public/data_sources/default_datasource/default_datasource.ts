/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../../../core/types';
import { IndexPatternSavedObjectAttrs } from '../../../data/common/index_patterns/index_patterns';
import { IndexPatternsContract, DataSourceConfig, DataSource } from '../../../data/public';

export class DefaultDslDataSource extends DataSource<
  any,
  any,
  Promise<Array<SavedObject<IndexPatternSavedObjectAttrs>> | null | undefined>,
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
    return await this.indexPatterns.getCache();
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async runQuery(queryParams: any) {
    return undefined;
  }
}
