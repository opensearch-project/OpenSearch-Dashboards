/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
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
    const dsId = ds.getId();
    if (dsId in this.dataSources) {
      throw new DataSourceRegistrationError(
        `Unable to register data source ${dsId}, error: data source name exists.`
      );
    } else {
      this.dataSources[dsId] = ds;
      this.dataSourcesSubject.next(this.dataSources);
      return { success: true, info: '' } as IDataSourceRegistrationResult;
    }
  }

  public get dataSources$() {
    return this.dataSourcesSubject.asObservable();
  }

  /**
   * Retrieve the registered data sources based on provided filters.
   * If no filters are provided, all registered data sources are returned.
   * @experimental This API is experimental and might change in future releases.
   * @param filter - An optional object with filter criteria (e.g., names of data sources).
   * @returns A record of filtered data sources.
   */
  getDataSources(filter?: IDataSourceFilter): Record<string, DataSource> {
    if (!filter || !Array.isArray(filter.names) || filter.names.length === 0)
      return this.dataSources;

    return filter.names.reduce<Record<string, DataSource>>((filteredDataSources, dsId) => {
      if (dsId in this.dataSources) {
        filteredDataSources[dsId] = this.dataSources[dsId];
      }
      return filteredDataSources;
    }, {} as Record<string, DataSource>);
  }

  /**
   * Registers functions responsible for fetching data for each data source type.
   *
   * @param fetchers - An array of fetcher configurations, each specifying how to fetch data for a specific data source type.
   */
  registerDataSourceFetchers(fetchers: DataSourceFetcher[]) {
    fetchers.forEach((fetcher) => {
      this.dataSourceFetchers[fetcher.type] = fetcher.registerDataSources;
    });
  }

  /**
   * Calls all registered data fetching functions to update data sources.
   * Typically used to initialize or refresh the data source configurations.
   */
  load() {
    Object.values(this.dataSourceFetchers).forEach((fetch) => fetch());
  }

  /**
   * Reloads all data source configurations by re-invoking the load method.
   * Useful for refreshing the system to reflect changes such as new data source registrations.
   */
  reload() {
    this.load();
  }
}
