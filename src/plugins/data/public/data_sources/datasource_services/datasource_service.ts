/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import {
  DataSourceRegistrationError,
  GenericDataSource,
  IDataSourceFilter,
  IDataSourceRegistrationResult,
} from './types';

export class DataSourceService {
  private static dataSourceService: DataSourceService;
  // A record to store all registered data sources, using the data source name as the key.
  private dataSources: Record<string, GenericDataSource> = {};
  private dataSourcesSubject: BehaviorSubject<Record<string, GenericDataSource>>;

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
    datasources: GenericDataSource[]
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
  async registerDataSource(ds: GenericDataSource): Promise<IDataSourceRegistrationResult> {
    const dsName = ds.getName();
    if (dsName in this.dataSources) {
      throw new DataSourceRegistrationError(
        `Unable to register datasource ${dsName}, error: datasource name exists.`
      );
    } else {
      this.dataSources[dsName] = ds;
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
  getDataSources(filter?: IDataSourceFilter): Record<string, GenericDataSource> {
    if (!filter || !Array.isArray(filter.names) || filter.names.length === 0)
      return this.dataSources;

    return filter.names.reduce<Record<string, GenericDataSource>>((filteredDataSources, dsName) => {
      if (dsName in this.dataSources) {
        filteredDataSources[dsName] = this.dataSources[dsName];
      }
      return filteredDataSources;
    }, {} as Record<string, GenericDataSource>);
  }
}
