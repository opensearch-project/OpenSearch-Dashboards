/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import { DEFAULT_QUERY, Dataset, DataSource, IndexPattern, UI_SETTINGS } from '../../../common';
import { IndexPatternsContract } from '../../index_patterns';

export class DataSetManager {
  private dataSet$: BehaviorSubject<Dataset | undefined>;
  private indexPatterns?: IndexPatternsContract;
  private defaultDataSet?: Dataset;

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.dataSet$ = new BehaviorSubject<Dataset | undefined>(undefined);
  }

  public init = async (indexPatterns: IndexPatternsContract) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.indexPatterns = indexPatterns;
    this.defaultDataSet = await this.fetchDefaultDataSet();
  };

  public initWithIndexPattern = (indexPattern: IndexPattern | null) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    this.defaultDataSet = {
      id: indexPattern.id,
      title: indexPattern.title,
      type: DEFAULT_QUERY.DATASET_TYPE,
      timeFieldName: indexPattern.timeFieldName,
      ...(indexPattern.dataSourceRef
        ? {
            dataSource: {
              id: indexPattern.dataSourceRef?.id,
              title: indexPattern.dataSourceRef?.name,
              type: indexPattern.dataSourceRef?.type,
            } as DataSource,
          }
        : {}),
    };
  };

  public getUpdates$ = () => {
    return this.dataSet$.asObservable().pipe(skip(1));
  };

  public getDataSet = () => {
    return this.dataSet$.getValue();
  };

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setDataSet = (dataSet: Dataset | undefined) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.dataSet$.next(dataSet);
  };

  public getDefaultDataSet = () => {
    return this.defaultDataSet;
  };

  public fetchDefaultDataSet = async (): Promise<Dataset | undefined> => {
    const defaultIndexPatternId = this.uiSettings.get('defaultIndex');
    if (!defaultIndexPatternId) {
      return undefined;
    }

    const indexPattern = await this.indexPatterns?.get(defaultIndexPatternId);
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    return {
      id: indexPattern.id,
      title: indexPattern.title,
      type: DEFAULT_QUERY.DATASET_TYPE,
      timeFieldName: indexPattern.timeFieldName,
      ...(indexPattern.dataSourceRef
        ? {
            dataSource: {
              id: indexPattern.dataSourceRef?.id,
              title: indexPattern.dataSourceRef?.name,
              type: indexPattern.dataSourceRef?.type,
            } as DataSource,
          }
        : {}),
    };
  };
}

export type DataSetContract = PublicMethodsOf<DataSetManager>;
