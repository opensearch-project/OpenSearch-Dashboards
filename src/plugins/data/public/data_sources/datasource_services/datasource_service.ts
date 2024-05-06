/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DataSourceRegistrationError,
  IDataSourceFilter,
  IDataSourceRegistrationResult,
  DataSourceFetcher,
} from './types';
import { DataSource } from '../datasource/datasource';

export class DataSourceService {
  private static dataSourceService: DataSourceService;
  // A record to store all registered data sources, using the data source name as the key.
  private dataSources: Record<string, DataSource> = {};
  private dataSourcesSubject: BehaviorSubject<Record<string, DataSource>>;
  // A record to store all data source fetchers, using the data source type as the key.
  // Once application starts, all the different types of data source supported with have their fetchers registered here.
  // And it becomes the single source of truth for reloading data sources.
  private dataSourceFetchers: Record<string, DataSourceFetcher['registerDataSources']> = {};

  private constructor() {
    this.dataSourcesSubject = new BehaviorSubject(this.dataSources);
  }

  static getInstance(): DataSourceService {
    if (!this.dataSourceService) {
      this.dataSourceService = new DataSourceService();
    }
    return this.dataSourceService;
  }

  /**
   * Register multiple data sources at once.
   *
   * @experimental This API is experimental and might change in future releases.
   * @param datasources - An array of data sources to be registered.
   * @returns An array of registration results, one for each data source.
   */
  async registerMultipleDataSources(
    datasources: DataSource[]
  ): Promise<IDataSourceRegistrationResult[]> {
    return Promise.all(datasources.map((ds) => this.registerDataSource(ds)));
  }

  /**
   * Register a single data source.
   * Throws an error if a data source with the same name is already registered.
   *
   * @experimental This API is experimental and might change in future releases.
   * @param ds - The data source to be registered.
   * @returns A registration result indicating success or failure.
   * @throws {DataSourceRegistrationError} Throws an error if a data source with the same name already exists.
   */
  async registerDataSource(ds: DataSource): Promise<IDataSourceRegistrationResult> {
    const dataSourceId = ds.getId();
    if (dataSourceId in this.dataSources) {
      throw new DataSourceRegistrationError(
        `Unable to register data source ${ds.getName()}, error: data source exists.`
      );
    } else {
      this.dataSources[dataSourceId] = ds;
      this.dataSourcesSubject.next(this.dataSources);
      return { success: true, info: '' } as IDataSourceRegistrationResult;
    }
  }

  private isFilterEmpty(filter: IDataSourceFilter): boolean {
    // Check if all filter properties are either undefined or empty arrays
    return Object.values(filter).every(
      (value) => !value || (Array.isArray(value) && value.length === 0)
    );
  }

  /**
   * Retrieve the registered data sources based on provided filters.
   * If no filters are provided, all registered data sources are returned.
   * @experimental This API is experimental and might change in future releases.
   * @param filter - An optional object with filter criteria (e.g., names of data sources).
   * @returns A record of filtered data sources.
   */
  public getDataSources$(filter?: IDataSourceFilter) {
    return this.dataSourcesSubject.asObservable().pipe(
      map((dataSources) => {
        // Check if the filter is provided and valid
        if (!filter || this.isFilterEmpty(filter)) {
          return dataSources;
        }

        // Apply filter
        return Object.entries(dataSources).reduce((acc, [id, dataSource]) => {
          const matchesId = !filter.ids || filter.ids.includes(id);
          const matchesName = !filter.names || filter.names.includes(dataSource.getName());
          const matchesType = !filter.types || filter.types.includes(dataSource.getType());

          if (matchesId && matchesName && matchesType) {
            acc[id] = dataSource;
          }

          return acc;
        }, {} as Record<string, DataSource>);
      })
    );
  }

  /**
   * Registers functions responsible for fetching data for each data source type.
   *
   * @param fetchers - An array of fetcher configurations, each specifying how to fetch data for a specific data source type.
   */
  registerDataSourceFetchers(fetchers: DataSourceFetcher[]) {
    return fetchers.forEach((fetcher) => {
      if (!this.dataSourceFetchers[fetcher.type])
        this.dataSourceFetchers[fetcher.type] = fetcher.registerDataSources;
    });
  }

  /**
   * Calls all registered data fetching functions to update data sources.
   * Typically used to initialize or refresh the data source configurations.
   */
  load() {
    this.reset();
    Object.values(this.dataSourceFetchers).forEach((fetch) => {
      try {
        fetch(); // Directly call the synchronous fetch function
      } catch (error) {
        // Handle fetch errors or take corrective actions here
        // TO-DO: Add error handling, maybe collect errors and show them in UI
      }
    });
  }

  /**
   * Reloads all data source configurations by re-invoking the load method.
   * Used for refreshing the system to reflect changes such as new data source registrations.
   */
  reload() {
    this.load();
  }

  /**
   * Resets all registered data sources.
   */
  reset() {
    this.dataSources = {};
    this.dataSourcesSubject.next(this.dataSources);
  }
}
