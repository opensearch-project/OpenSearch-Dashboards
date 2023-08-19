/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty, forEach } from 'lodash';
import {
  DataSource,
  IDataSetParams,
  IDataSourceMetaData,
  IDataSourceQueryParams,
  IDataSourceQueryResult,
  ISourceDataSet,
} from '../datasource';
import {
  IDataSourceService,
  IDataSourceFilters,
  IDataSourceRegisterationResult,
  DataSourceRegisterationError,
} from './types';

export type DataSourceType = DataSource<
  IDataSourceMetaData,
  IDataSetParams,
  ISourceDataSet,
  IDataSourceQueryParams,
  IDataSourceQueryResult
>;

export class DataSourceService implements IDataSourceService {
  private static dataSourceService: IDataSourceService;
  // A record to store all registered data sources, using the data source name as the key.
  private dataSources: Record<string, DataSourceType> = {};

  private constructor() {}

  static getInstance(): IDataSourceService {
    if (!this.dataSourceService) {
      this.dataSourceService = new DataSourceService();
    }
    return this.dataSourceService;
  }

  /**
   * Register multiple data sources at once.
   *
   * @param datasources - An array of data sources to be registered.
   * @returns An array of registration results, one for each data source.
   */
  registerMultipleDataSources(datasources: DataSourceType[]) {
    return datasources.map(this.registerDataSource);
  }

  /**
   * Register a single data source.
   * Throws an error if a data source with the same name is already registered.
   *
   * @param ds - The data source to be registered.
   * @returns A registration result indicating success or failure.
   * @throws {DataSourceRegisterationError} Throws an error if a data source with the same name already exists.
   */
  async registerDataSource(ds: DataSourceType): Promise<IDataSourceRegisterationResult> {
    const dsName = ds.getName();
    if (dsName in this.dataSources) {
      throw new DataSourceRegisterationError(
        `Unable to register datasource ${dsName}, error: datasource name exists.`
      );
    } else {
      this.dataSources = {
        ...this.dataSources,
        [dsName]: ds,
      };
      return { success: true, info: '' } as IDataSourceRegisterationResult;
    }
  }

  /**
   * Retrieve the registered data sources based on provided filters.
   * If no filters are provided, all registered data sources are returned.
   *
   * @param filters - An optional object with filter criteria (e.g., names of data sources).
   * @returns A record of filtered data sources.
   */
  getDataSources(filters?: IDataSourceFilters): Record<string, DataSourceType> {
    if (!filters || isEmpty(filters.names)) return this.dataSources;
    const filteredDataSources: Record<string, DataSourceType> = {};
    forEach(filters.names, (dsName) => {
      if (dsName in this.dataSources) {
        filteredDataSources[dsName] = this.dataSources.dsName;
      }
    });
    return filteredDataSources;
  }
}
