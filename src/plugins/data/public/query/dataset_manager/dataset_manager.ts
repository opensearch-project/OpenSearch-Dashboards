/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  SIMPLE_DATA_SET_TYPES,
  SimpleDataSet,
  SimpleDataSource,
  UI_SETTINGS,
} from '../../../common';
import { IndexPatternsContract } from '../../index_patterns';

export class DataSetManager {
  private dataSet$: BehaviorSubject<SimpleDataSet | undefined>;
  private indexPatterns?: IndexPatternsContract;
  private defaultDataSet?: SimpleDataSet;

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.dataSet$ = new BehaviorSubject<SimpleDataSet | undefined>(undefined);
  }

  public init = async (indexPatterns: IndexPatternsContract) => {
    this.indexPatterns = indexPatterns;
    this.defaultDataSet = await this.fetchDefaultDataSet();
    return this.defaultDataSet;
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
  public setDataSet = (dataSet: SimpleDataSet | undefined) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.dataSet$.next(dataSet);
  };

  public getDefaultDataSet = () => {
    return this.defaultDataSet;
  };

  public fetchDefaultDataSet = async (): Promise<SimpleDataSet | undefined> => {
    const defaultIndexPatternId = this.uiSettings.get('defaultIndex');
    if (!defaultIndexPatternId) {
      return undefined;
    }

    const indexPattern = await this.indexPatterns?.get(defaultIndexPatternId);
    if (!indexPattern) {
      return undefined;
    }

    if (!indexPattern.id) {
      return undefined;
    }

    return {
      id: indexPattern.id,
      title: indexPattern.title,
      type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
      timeFieldName: indexPattern.timeFieldName,
      ...(indexPattern.dataSourceRef
        ? {
            dataSourceRef: {
              id: indexPattern.dataSourceRef?.id,
              name: indexPattern.dataSourceRef?.name,
              type: indexPattern.dataSourceRef?.type,
            } as SimpleDataSource,
          }
        : {}),
    };
  };
}

export type DataSetContract = PublicMethodsOf<DataSetManager>;
