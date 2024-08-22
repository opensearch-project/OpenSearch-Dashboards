/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CoreStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { skip } from 'rxjs/operators';
import {
  Dataset,
  IndexPattern,
  UI_SETTINGS,
  DEFAULT_DATA,
  DataStructure,
  CachedDataStructure,
  DataStructureCache,
  toCachedDataStructure,
  createDataStructureCache,
} from '../../../../common';
import { IndexPatternsContract } from '../../../index_patterns';
import { indexPatternHandlerConfig, indexHandlerConfig } from './lib';
import { DatasetHandlerConfig } from './types';

export class DatasetManager {
  private dataset$: BehaviorSubject<Dataset | undefined>;
  private indexPatterns?: IndexPatternsContract;
  private defaultDataset?: Dataset;
  private dataStructureCache: DataStructureCache;
  private datasetHandlers: Map<string, DatasetHandlerConfig>;
  private dataStructuresMap: Map<string, DataStructure>;
  private categoryDataStructures: DataStructure[] = [];

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
    this.registerDatasetHandler(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN, indexPatternHandlerConfig);
    this.registerDatasetHandler(DEFAULT_DATA.SET_TYPES.INDEX, indexHandlerConfig);
  }

  /**
   * Registers a dataset handler for a specific type.
   * @param {string} type - The type of dataset.
   * @param {DatasetHandlerConfig} handler - The handler configuration.
   */
  public registerDatasetHandler(type: string, handler: DatasetHandlerConfig) {
    this.datasetHandlers.set(type, handler);
  }

  /**
   * Gets all CATEGORY type data structures.
   * @returns {DataStructure[]} An array of CATEGORY type data structures.
   */
  public getCategoryDataStructures(): DataStructure[] {
    return this.categoryDataStructures;
  }

  /**
   * Fetch all CATEGORY type data structures.
   * @returns {DataStructure[]} An array of CATEGORY type data structures.
   */
  public async fetchCategoryDataStructures(
    savedObjects: SavedObjectsClientContract,
    rootDataStructure: DataStructure
  ): Promise<DataStructure[]> {
    const categoryPromises = Array.from(this.datasetHandlers.values()).map((datasetHandler) => {
      const category = datasetHandler.fetchOptions(savedObjects, rootDataStructure);
      return category;
    });
    const categories = await Promise.all(categoryPromises);
    this.categoryDataStructures = categories.flat();
    return this.categoryDataStructures;
  }

  /**
   * @returns {boolean} if the data structure is the leaf data structure, where it has no children
   */
  public isLeafDataStructure(dataStructure: DataStructure): boolean {
    if (
      dataStructure.type === DEFAULT_DATA.STRUCTURES.ROOT.type ||
      dataStructure.type === DEFAULT_DATA.STRUCTURES.CATEGORY.type
    ) {
      return false;
    }
    const handler = this.datasetHandlers.get(dataStructure.type);

    if (!handler) {
      throw new Error(`No handler found for type: ${dataStructure.type}`);
    }

    return handler.isLeaf(dataStructure);
  }

  /**
   * @returns {boolean} if the data structure is the leaf data structure, where it has no children
   */
  public toDataset(dataStructure: DataStructure): Dataset {
    const handler = this.datasetHandlers.get(dataStructure.type);

    if (!handler) {
      throw new Error(`No handler found for type: ${dataStructure.type}`);
    }

    return handler.toDataset(dataStructure);
  }

  /**
   * Fetches options for a given data structure.
   * @param {DataStructure} dataStructure - The data structure to fetch options for.
   * @returns {Promise<DataStructure[]>} A promise that resolves to an array of child data structures.
   */
  public async fetchOptions(
    savedObjects: SavedObjectsClientContract,
    dataStructure: DataStructure
  ): Promise<DataStructure[]> {
    switch (dataStructure.type) {
      case DEFAULT_DATA.STRUCTURES.ROOT.type: {
        const categories = await this.fetchCategoryDataStructures(savedObjects, dataStructure);
        return categories;
      }
      case DEFAULT_DATA.STRUCTURES.CATEGORY.type: {
        return dataStructure.children || [];
      }
      case DEFAULT_DATA.STRUCTURES.DATASET.type:
        const category = this.findDataStructureCategory(dataStructure);

        if (!category) {
          throw new Error(`No category found for dataset: ${dataStructure.id}`);
        }

        const dataset = this.datasetHandlers.get(dataStructure.type)?.toDataset(dataStructure);
        this.setDataset(dataset);
        return [DEFAULT_DATA.STRUCTURES.NULL];
      default:
        const handler = this.datasetHandlers.get(dataStructure.type);
        if (!handler) {
          throw new Error(`No handler registered for type: ${dataStructure.type}`);
        }

        if (handler.isLeaf(dataStructure)) {
          return [DEFAULT_DATA.STRUCTURES.NULL];
        }

        const cachedChildren = this.getCachedChildren(dataStructure.id);
        if (cachedChildren.length > 0) {
          return cachedChildren;
        }

        if (!this.indexPatterns) {
          throw new Error('IndexPatterns not initialized');
        }

        const children = await handler.fetchOptions(savedObjects, dataStructure);
        this.cacheDataStructures(children);
        return children;
    }
  }

  private findDataStructureCategory(dataStructure: DataStructure): DataStructure | null {
    let current: DataStructure | undefined = dataStructure;
    while (current && current.type !== DEFAULT_DATA.STRUCTURES.CATEGORY.type) {
      current = current.parent;
    }
    return current || null;
  }

  /**
   * Gets cached children for a given parent ID.
   * @param {string} parentId - The ID of the parent data structure.
   * @returns {DataStructure[]} An array of child data structures.
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
   * @param {DataStructure[]} dataStructures - The data structures to cache.
   */
  private cacheDataStructures(dataStructures: DataStructure[]) {
    dataStructures.forEach((ds) => {
      const fullId = this.getFullId(ds);
      this.dataStructuresMap.set(fullId, ds);
      const cachedDs = toCachedDataStructure(ds);
      this.dataStructureCache.set(fullId, cachedDs);

      // If the data structure is a CATEGORY type, add it to the categoryDataStructures array
      if (ds.type === 'CATEGORY') {
        this.categoryDataStructures.push(ds);
      }
    });
  }

  /**
   * Gets the full ID for a data structure, including its parent's ID.
   * @param dataStructure - The data structure to get the full ID for.
   * @returns The full ID of the data structure.
   */
  private getFullId(dataStructure: DataStructure): string {
    switch (dataStructure.type) {
      case DEFAULT_DATA.STRUCTURES.ROOT.type:
      case DEFAULT_DATA.STRUCTURES.CATEGORY.type:
        return dataStructure.id;
      default:
        if (!dataStructure.parent) {
          return dataStructure.id;
        }
        const parentId = this.getFullId(dataStructure.parent);
        const separator =
          dataStructure.parent.type === DEFAULT_DATA.STRUCTURES.DATA_SOURCE.type ? '::' : '.';
        return `${parentId}${separator}${dataStructure.id}`;
    }
  }
  /**
   * Sets the current dataset.
   * @param {Dataset | undefined} dataset - The dataset to set.
   */
  public setDataset(dataset: Dataset | undefined) {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.dataset$.next(dataset);

    if (dataset) {
      const handler = this.datasetHandlers.get(dataset.type);
      if (handler) {
        const dataStructure = handler.toDataStructure(dataset);
        this.cacheDataStructures([dataStructure]);
      }
    }
  }

  /**
   * Gets the current dataset.
   * @returns {Dataset | undefined} The current dataset.
   */
  public getDataset(): Dataset | undefined {
    return this.dataset$.getValue();
  }

  /**
   * Gets an observable of dataset updates.
   * @returns {Observable<Dataset | undefined>} An observable of dataset updates.
   */
  public getUpdates$() {
    return this.dataset$.asObservable().pipe(skip(1));
  }

  /**
   * Gets a cached data structure by ID.
   * @param {string} id - The ID of the data structure to retrieve.
   * @returns {CachedDataStructure | undefined} The cached data structure, if found.
   */
  public getCachedDataStructure(id: string): CachedDataStructure | undefined {
    return this.dataStructureCache.get(id);
  }

  /**
   * Clears the data structure cache.
   * @param {string} [id] - The ID of the specific data structure to clear. If not provided, clears all.
   */
  public clearDataStructureCache(id?: string) {
    if (id) {
      this.dataStructureCache.clear(id);
      this.dataStructuresMap.delete(id);
      this.categoryDataStructures = this.categoryDataStructures.filter((ds) => ds.id !== id);
    } else {
      this.dataStructureCache.clearAll();
      this.dataStructuresMap.clear();
      this.categoryDataStructures = [];
    }
  }

  /**
   * Initializes the DatasetManager with index patterns.
   * @param {IndexPatternsContract} indexPatterns - The index patterns contract.
   */
  public init = async (indexPatterns: IndexPatternsContract) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    this.indexPatterns = indexPatterns;
    this.defaultDataset = await this.fetchDefaultDataset();
  };

  /**
   * Initializes the DatasetManager with an index pattern.
   * @param {IndexPattern | null} indexPattern - The index pattern to initialize with.
   */
  public initWithIndexPattern = (indexPattern: IndexPattern | null) => {
    if (!this.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED)) return;
    if (!indexPattern || !indexPattern.id) {
      return undefined;
    }

    const handler = this.datasetHandlers.get(DEFAULT_DATA.SET_TYPES.INDEX_PATTERN);
    if (handler) {
      this.defaultDataset = handler.toDataset({
        id: indexPattern.id,
        title: indexPattern.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      });
    }
  };

  /**
   * Gets the default dataset.
   * @returns {Dataset | undefined} The default dataset.
   */
  public getDefaultDataset = () => {
    return this.defaultDataset;
  };

  /**
   * Fetches the default dataset.
   * @returns {Promise<Dataset | undefined>} A promise that resolves to the default dataset.
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
      return handler.toDataset({
        id: indexPattern.id,
        title: indexPattern.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      });
    }

    return undefined;
  };
}

export type DatasetContract = PublicMethodsOf<DatasetManager>;
