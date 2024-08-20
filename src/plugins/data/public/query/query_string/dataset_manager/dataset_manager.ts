/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  DEFAULT_QUERY,
  Dataset,
  DataSource,
  IndexPattern,
  UI_SETTINGS,
  DatasetTypeConfig,
} from '../../../../common';
import { IndexPatternsContract } from '../../../index_patterns';
import { DataStructureCache } from './datastructure_cache/datastructure_cache';

export class DatasetManager {
  private dataset$: BehaviorSubject<Dataset | undefined>;
  private indexPatterns?: IndexPatternsContract;
  private defaultDataset?: Dataset;
  private datasetTypes: Map<string, DatasetTypeConfig> = new Map();
  private dataStructureCache: DataStructureCache;

  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.dataset$ = new BehaviorSubject<Dataset | undefined>(undefined);
    this.dataStructureCache = new DataStructureCache();
  }

  public init = async (indexPatterns: IndexPatternsContract) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.indexPatterns = indexPatterns;
    this.defaultDataset = await this.fetchDefaultDataset();
  };

  public initWithIndexPattern = (indexPattern: IndexPattern | null) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    this.defaultDataset = {
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

  public registerType = (type: string, config: DatasetTypeConfig) => {
    if (this.datasetTypes.has(type)) {
      throw new Error(`Error: ${type} has already been registered`);
    }
    this.datasetTypes.set(type, config);
  };

  public getTypes = () => {
    return Array.from(this.datasetTypes.keys());
  };

  public getTypeConfig = (type: string) => {
    return this.datasetTypes.get(type);
  };

  public getUpdates$ = () => {
    return this.dataset$.asObservable().pipe(skip(1));
  };

  public getDataset = () => {
    return this.dataset$.getValue();
  };

  /**
   * Updates the query.
   * @param {Query} query
   */
  public setDataset = (dataSet: Dataset | undefined) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.dataset$.next(dataSet);
  };

  public getDefaultDataset = () => {
    return this.defaultDataset;
  };

  public fetchDefaultDataset = async (): Promise<Dataset | undefined> => {
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

export type DatasetContract = PublicMethodsOf<DatasetManager>;
