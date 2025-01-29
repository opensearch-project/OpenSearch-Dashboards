/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import LRUCache from 'lru-cache';
import { CoreStart } from 'opensearch-dashboards/public';
import {
  CachedDataStructure,
  Dataset,
  DataStorage,
  DataStructure,
  DEFAULT_DATA,
  IndexPatternFieldMap,
  IndexPatternSpec,
  UI_SETTINGS,
} from '../../../../common';
import { IndexPatternsContract } from '../../../index_patterns';
import { IDataPluginServices } from '../../../types';
import { indexPatternTypeConfig, indexTypeConfig } from './lib';
import { DatasetTypeConfig, DataStructureFetchOptions } from './types';

export class DatasetService {
  private indexPatterns?: IndexPatternsContract;
  private defaultDataset?: Dataset;
  private typesRegistry: Map<string, DatasetTypeConfig> = new Map();
  private recentDatasets: LRUCache<string, Dataset>;

  constructor(
    private readonly uiSettings: CoreStart['uiSettings'],
    private readonly sessionStorage: DataStorage
  ) {
    if (this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) {
      this.registerDefaultTypes();
    }
    this.recentDatasets = new LRUCache({
      max: this.uiSettings.get(UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS),
    });
    this.deserializeRecentDatasets();
  }

  /**
   * Registers default handlers for index patterns and indices.
   */
  private registerDefaultTypes() {
    this.registerType(indexPatternTypeConfig);
    this.registerType(indexTypeConfig);
  }

  public async init(indexPatterns: IndexPatternsContract): Promise<void> {
    this.indexPatterns = indexPatterns;
    this.defaultDataset = await this.fetchDefaultDataset();
  }

  public registerType(handlerConfig: DatasetTypeConfig): void {
    this.typesRegistry.set(handlerConfig.id, handlerConfig);
  }

  public getType(type: string): DatasetTypeConfig | undefined {
    return this.typesRegistry.get(type);
  }

  public getTypes(): DatasetTypeConfig[] {
    return Array.from(this.typesRegistry.values());
  }

  public getDefault(): Dataset | undefined {
    return this.defaultDataset;
  }

  private serializeRecentDatasets(): void {
    this.sessionStorage.set('recentDatasets', this.getRecentDatasets());
  }

  private deserializeRecentDatasets(): void {
    const cacheData = this.sessionStorage.get('recentDatasets');
    if (cacheData) {
      cacheData.forEach((dataset: Dataset) => this.addRecentDataset(dataset, false));
    }
  }

  public getRecentDatasets(): Dataset[] {
    // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8814
    return [];
    // return this.recentDatasets.values();
  }

  public addRecentDataset(dataset: Dataset | undefined, serialize: boolean = true): void {
    if (dataset) {
      this.recentDatasets.set(dataset.id, dataset);
    }
    if (serialize) {
      this.serializeRecentDatasets();
    }
  }

  public async cacheDataset(
    dataset: Dataset,
    services: Partial<IDataPluginServices>
  ): Promise<void> {
    const type = this.getType(dataset?.type);
    try {
      const asyncType = type?.meta.isFieldLoadAsync ?? false;
      if (dataset && dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
        const fetchedFields = asyncType
          ? ({} as IndexPatternFieldMap)
          : await type?.fetchFields(dataset, services);
        const spec = {
          id: dataset.id,
          title: dataset.title,
          timeFieldName: dataset.timeFieldName,
          fields: fetchedFields,
          fieldsLoading: asyncType,
          dataSourceRef: dataset.dataSource
            ? {
                id: dataset.dataSource.id!,
                name: dataset.dataSource.title,
                type: dataset.dataSource.type,
              }
            : undefined,
        } as IndexPatternSpec;
        const temporaryIndexPattern = await this.indexPatterns?.create(spec, true);

        // Load schema asynchronously if it's an async index pattern
        if (asyncType && temporaryIndexPattern) {
          type!
            .fetchFields(dataset, services)
            .then((fields) => {
              temporaryIndexPattern.fields.replaceAll([...fields]);
              this.indexPatterns?.saveToCache(dataset.id, temporaryIndexPattern);
            })
            .catch((error) => {
              throw new Error(`Error while fetching fields for dataset ${dataset.id}:`);
            })
            .finally(() => {
              temporaryIndexPattern.setFieldsLoading(false);
            });
        }

        if (temporaryIndexPattern) {
          this.indexPatterns?.saveToCache(dataset.id, temporaryIndexPattern);
        }
      }
    } catch (error) {
      throw new Error(`Failed to load dataset: ${dataset?.id}`);
    }
  }
  public async fetchOptions(
    services: IDataPluginServices,
    path: DataStructure[],
    dataType: string,
    options?: DataStructureFetchOptions
  ): Promise<DataStructure> {
    const type = this.typesRegistry.get(dataType);
    if (!type) {
      throw new Error(`No handler found for type: ${dataType}`);
    }

    const lastPathItem = path[path.length - 1];
    const fetchOptionsKey = Object.entries(options || {})
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const cacheKey =
      `${dataType}.${lastPathItem.id}` + (fetchOptionsKey.length ? `?${fetchOptionsKey}` : '');
    if (type.meta.cacheOptions) {
      const cachedDataStructure = this.sessionStorage.get<CachedDataStructure>(cacheKey);
      if (cachedDataStructure?.children?.length > 0) {
        return this.cacheToDataStructure(dataType, cachedDataStructure);
      }
    }

    const fetchedDataStructure = await type.fetch(services, path, options);
    if (type.meta.cacheOptions) {
      this.cacheDataStructure(dataType, fetchedDataStructure);
    }
    return fetchedDataStructure;
  }

  private cacheToDataStructure(
    dataType: string,
    cachedDataStructure: CachedDataStructure
  ): DataStructure {
    const reconstructed: DataStructure = {
      ...cachedDataStructure,
      parent: undefined,
      children: cachedDataStructure.children
        .map((childId) => {
          const cachedChild = this.sessionStorage.get<CachedDataStructure>(
            `${dataType}.${childId}`
          );
          if (!cachedChild) return;
          return {
            id: cachedChild.id,
            title: cachedChild.title,
            type: cachedChild.type,
            meta: cachedChild.meta,
          } as DataStructure;
        })
        .filter((child): child is DataStructure => !!child),
    };

    return reconstructed;
  }

  private cacheDataStructure(dataType: string, dataStructure: DataStructure) {
    this.setLastCacheTime(Date.now());
    const cachedDataStructure: CachedDataStructure = {
      id: dataStructure.id,
      title: dataStructure.title,
      type: dataStructure.type,
      parent: dataStructure.parent?.id || '',
      children: dataStructure.children?.map((child) => child.id) || [],
      hasNext: dataStructure.hasNext,
      paginationToken: dataStructure.paginationToken,
      multiSelect: dataStructure.multiSelect,
      columnHeader: dataStructure.columnHeader,
      meta: dataStructure.meta,
    };

    this.sessionStorage.set(`${dataType}.${dataStructure.id}`, cachedDataStructure);

    dataStructure.children?.forEach((child) => {
      const cachedChild: CachedDataStructure = {
        id: child.id,
        title: child.title,
        type: child.type,
        parent: dataStructure.id,
        children: [],
        meta: child.meta,
      };
      this.sessionStorage.set(`${dataType}.${child.id}`, cachedChild);
    });
  }

  public clearCache(): void {
    this.sessionStorage.clear();
  }

  public getLastCacheTime(): number | undefined {
    return Number(this.sessionStorage.get('lastCacheTime')) || undefined;
  }

  public removeFromRecentDatasets(datasetId: string): void {
    this.recentDatasets.del(datasetId);
    this.serializeRecentDatasets();
  }

  private setLastCacheTime(time: number): void {
    this.sessionStorage.set('lastCacheTime', time);
  }

  private async fetchDefaultDataset(): Promise<Dataset | undefined> {
    const defaultIndexPatternId = this.uiSettings.get('defaultIndex');
    if (!defaultIndexPatternId) {
      return undefined;
    }

    const indexPattern = await this.indexPatterns?.get(defaultIndexPatternId);
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    let dataSource;
    if (indexPattern.dataSourceRef) {
      dataSource = await this.indexPatterns?.getDataSource(indexPattern.dataSourceRef?.id);
    }

    const dataType = this.typesRegistry.get(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (dataType) {
      const dataset = dataType.toDataset([
        {
          id: indexPattern.id,
          title: indexPattern.title,
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
          parent: dataSource
            ? {
                id: dataSource.id,
                title: dataSource.attributes?.title,
                type: dataSource.attributes?.dataSourceEngineType || '',
              }
            : undefined,
        },
      ]);

      return { ...dataset, timeFieldName: indexPattern.timeFieldName };
    }

    return undefined;
  }
}

export type DatasetServiceContract = PublicMethodsOf<DatasetService>;
