/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternsContract } from '../../../data/public';
import { DataSource } from '../../../data/public';

interface DataSourceConfig {
  name: string;
  type: string;
  metadata: any;
  indexPatterns: IndexPatternsContract;
}

export class DefaultDslDataSource extends DataSource<
  any,
  any,
  Promise<SavedObject<IndexPatternSavedObjectAttrs>[] | null | undefined>,
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
    const ips = await this.indexPatterns.getCache();
    return {
      ds: this, // datasource instance
      data_sets: ips || [], // original dataset
    };
  }

  async testConnection(): Promise<void> {
    throw new Error('This operation is not supported for this class.');
  }

  async runQuery(queryParams: any) {
    return null;
  }
}
