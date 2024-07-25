/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  IndexPatternsService,
  SIMPLE_DATA_SET_TYPES,
  SimpleDataSet,
  SimpleDataSource,
} from '../../../common';

export class DataSetManager {
  private dataSet$: BehaviorSubject<SimpleDataSet | undefined>;
  private indexPatterns?: IndexPatternsService;
  private defaultDataSet?: SimpleDataSet;

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.dataSet$ = new BehaviorSubject<SimpleDataSet | undefined>(undefined);
  }

  public init = async (indexPatterns: IndexPatternsService) => {
    this.indexPatterns = indexPatterns;
    this.defaultDataSet = await this.fetchDefaultDataSet();
  };

  public getUpdates$ = () => {
    return this.dataSet$.asObservable();
  };

  public getDataSet = () => {
    return this.dataSet$.getValue();
  };

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setDataSet = (dataSet: SimpleDataSet | undefined) => {
    this.dataSet$.next(dataSet);
  };

  public getDefaultDataSet = () => {
    return this.defaultDataSet;
  };

  private fetchDefaultDataSet = async (): Promise<SimpleDataSet | undefined> => {
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
