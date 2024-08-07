/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  IndexPattern,
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
      type: SIMPLE_DATA_SET_TYPES.INDEX_PATTERN,
      timeFieldName: indexPattern.timeFieldName,
      fields: indexPattern.fields,
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

    // if (dataSet) {
    //   const { fields, ...dataSetWithoutFields } = dataSet;
    //   this.dataSet$.next(dataSetWithoutFields);
    // } else {
    //   this.dataSet$.next(undefined);
    // }
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
    if (!indexPattern || !indexPattern.id) {
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
