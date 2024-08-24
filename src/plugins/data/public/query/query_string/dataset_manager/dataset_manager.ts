/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BehaviorSubject } from 'rxjs';
import { CoreStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  Dataset,
  DEFAULT_DATA,
  DataStructure,
  CachedDataStructure,
  DataStructureCache,
  toCachedDataStructure,
  createDataStructureCache,
  DatasetField,
} from '../../../../common';
import { IndexPatternsContract } from '../../../index_patterns';
import { indexPatternHandlerConfig, indexHandlerConfig } from './lib';
import { DatasetHandlerConfig } from './types';

/**
 * Manages datasets and their associated handlers.
 */
export class DatasetManager {
  private dataset$: BehaviorSubject<Dataset | undefined>;
  private indexPatterns?: IndexPatternsContract;
  private defaultDataset?: Dataset;
  private dataStructureCache: DataStructureCache;
  private datasetHandlers: Map<string, DatasetHandlerConfig>;
  private dataStructuresMap: Map<string, DataStructure>;

  /**
   * Creates an instance of DatasetManager.
   * @param uiSettings - The CoreStart's uiSettings.
   * @param savedObjects - The SavedObjectsClientContract.
   */
  constructor(private readonly uiSettings: CoreStart['uiSettings']) {
    this.dataset$ = new BehaviorSubject<Dataset | undefined>(undefined);
    this.dataStructureCache = createDataStructureCache();
    this.datasetHandlers = new Map();
    this.dataStructuresMap = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Registers default handlers for index patterns and indices.
   */
  private registerDefaultHandlers() {
    this.registerDatasetHandler(indexPatternHandlerConfig);
    this.registerDatasetHandler(indexHandlerConfig);
  }

  /**
   * Registers a dataset handler.
   * @param handler - The dataset handler configuration.
   */
  public registerDatasetHandler(handler: DatasetHandlerConfig) {
    this.datasetHandlers.set(handler.id, handler);
  }

  /**
   * Gets all registered dataset handlers.
   * @returns An array of dataset handler configurations.
   */
  public getDatasetHandlers(): DatasetHandlerConfig[] {
    return Array.from(this.datasetHandlers.values());
  }

  /**
   * Gets a dataset handler by its ID.
   * @param id - The ID of the dataset handler.
   * @returns The dataset handler configuration, or undefined if not found.
   */
  public getDatasetHandlerById(id: string): DatasetHandlerConfig | undefined {
    return this.datasetHandlers.get(id);
  }

  /**
   * Fetches options for a given data structure.
   * @param dataStructure - The data structure to fetch options for.
   * @returns A promise that resolves to a DatasetHandlerFetchResponse.
   */
  public fetchOptions(
    savedObjects: SavedObjectsClientContract,
    path: DataStructure[]
  ): Promise<DataStructure> {
    const dataStructure = path[path.length - 1];
    const handler = this.getHandlerForDataStructure(dataStructure);
    return handler.fetch(savedObjects, path);
  }

  /**
   * Checks if a given data structure is a leaf node.
   * @param dataStructure - The data structure to check.
   * @returns True if the data structure is a leaf node, false otherwise.
   */
  public isLeafDataStructure(dataStructure: DataStructure): boolean {
    const handler = this.getHandlerForDataStructure(dataStructure);
    return handler.id === dataStructure.type;
  }

  /**
   * Converts a data structure to a dataset.
   * @param dataStructure - The data structure to convert.
   * @returns A promise that resolves to a BaseDataset.
   */
  public toDataset(path: DataStructure[]): Dataset {
    const dataStructure = path[path.length - 1];
    const handler = this.getHandlerForDataStructure(dataStructure);
    return handler.toDataset(path);
  }

  /**
   * Gets the appropriate handler for a given data structure.
   * @param dataStructure - The data structure to get the handler for.
   * @returns The dataset handler configuration.
   * @throws Error if no handler is found.
   */
  private getHandlerForDataStructure(dataStructure: DataStructure): DatasetHandlerConfig {
    const handler =
      this.datasetHandlers.get(dataStructure.type) ||
      this.datasetHandlers.get(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (!handler) {
      throw new Error(`No handler found for type: ${dataStructure.type}`);
    }
    return handler;
  }

  /**
   * Gets cached children for a given parent ID.
   * @param parentId - The ID of the parent data structure.
   * @returns An array of child data structures.
   */
  private getCachedChildren(parentId: string): DataStructure[] {
    const cachedStructure = this.dataStructureCache.get(parentId);
    if (!cachedStructure) return [];

    return cachedStructure.children
      .map((childId) => this.dataStructuresMap.get(childId))
      .filter((child): child is DataStructure => !!child);
  }

  /**
   * Caches an array of data structures.
   * @param dataStructures - The data structures to cache.
   */
  private cacheDataStructures(dataStructures: DataStructure[]) {
    dataStructures.forEach((ds) => {
      const fullId = this.getFullId(ds);
      this.dataStructuresMap.set(fullId, ds);
      const cachedDs = toCachedDataStructure(ds);
      this.dataStructureCache.set(fullId, cachedDs);
    });
  }

  /**
   * Gets the full ID for a data structure, including its parent's ID.
   * @param dataStructure - The data structure to get the full ID for.
   * @returns The full ID of the data structure.
   */
  private getFullId(dataStructure: DataStructure): string {
    if (!dataStructure.parent) {
      return dataStructure.id;
    }
    const parentId = this.getFullId(dataStructure.parent);
    const separator =
      dataStructure.parent.type === DEFAULT_DATA.STRUCTURES.DATA_SOURCE.type ? '::' : '.';
    return `${parentId}${separator}${dataStructure.id}`;
  }

  /**
   * Sets the current dataset.
   * @param dataset - The dataset to set.
   */
  public async setDataset(dataset: Dataset | undefined, fields?: DatasetField[]) {
    if (dataset) {
      const spec = {
        ...dataset,
        fields: undefined,
        dataSourceRef: dataset.dataSource
          ? {
              id: dataset.dataSource.id!,
              name: dataset.dataSource.title,
              type: dataset.dataSource.type,
            }
          : undefined,
      };
      const temporaryIndexPattern = await this.indexPatterns!.create(spec, true);
      this.indexPatterns?.saveToCache(dataset.id, temporaryIndexPattern);
    }
    this.dataset$.next(dataset);
  }

  /**
   * Gets the current dataset.
   * @returns The current dataset, or undefined if not set.
   */
  public getDataset(): Dataset | undefined {
    return this.dataset$.getValue();
  }

  /**
   * Gets an observable of dataset updates.
   * @returns An observable of dataset updates.
   */
  public getUpdates$() {
    return this.dataset$.asObservable().pipe(skip(1));
  }

  /**
   * Gets a cached data structure by ID.
   * @param id - The ID of the data structure to retrieve.
   * @returns The cached data structure, if found.
   */
  public getCachedDataStructure(id: string): CachedDataStructure | undefined {
    return this.dataStructureCache.get(id);
  }

  /**
   * Clears the data structure cache.
   * @param id - The ID of the specific data structure to clear. If not provided, clears all.
   */
  public clearDataStructureCache(id?: string) {
    if (id) {
      this.dataStructureCache.clear(id);
      this.dataStructuresMap.delete(id);
    } else {
      this.dataStructureCache.clearAll();
      this.dataStructuresMap.clear();
    }
  }

  /**
   * Initializes the DatasetManager with index patterns.
   * @param indexPatterns - The index patterns contract.
   */
  public init = async (indexPatterns: IndexPatternsContract) => {
    this.indexPatterns = indexPatterns;
    this.defaultDataset = await this.fetchDefaultDataset();
  };

  /**
   * Gets the default dataset.
   * @returns The default dataset, or undefined if not set.
   */
  public getDefaultDataset = () => {
    return this.defaultDataset;
  };

  /**
   * Fetches the default dataset.
   * @returns A promise that resolves to the default dataset, or undefined if not found.
   */
  public fetchDefaultDataset = async (): Promise<Dataset | undefined> => {
    const defaultIndexPatternId = this.uiSettings.get('defaultIndex');
    if (!defaultIndexPatternId || !this.indexPatterns) {
      return undefined;
    }

    const indexPattern = await this.indexPatterns.get(defaultIndexPatternId);
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    const handler = this.datasetHandlers.get(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (handler) {
      const dataset = handler.toDataset([
        {
          id: indexPattern.id,
          title: indexPattern.title,
          type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
        },
      ]);
      return { ...dataset, timeFieldName: indexPattern.timeFieldName };
    }

    return undefined;
  };
}

export type DatasetContract = PublicMethodsOf<DatasetManager>;
