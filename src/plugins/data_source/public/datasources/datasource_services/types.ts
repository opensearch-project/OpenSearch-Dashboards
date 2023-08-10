/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataSource,
  IDataSetParams,
  IDataSourceMetaData,
  IDataSourceQueryParams,
  IDataSourceQueryResult,
  ISourceDataSet,
} from '../datasource';

export interface IDataSourceFilters {
  names: string[];
}

export interface IDataSourceRegisterationResult {
  success: boolean;
  info: string;
}

export class DataSourceRegisterationError extends Error {
  success: boolean;
  info: string;
  constructor(message: string) {
    super(message);
    this.success = false;
    this.info = message;
  }
}

export interface IDataSourceService {
  registerDatasource: (
    ds: DataSource<
      IDataSourceMetaData,
      IDataSetParams,
      ISourceDataSet,
      IDataSourceQueryParams,
      IDataSourceQueryResult
    >
  ) => Promise<IDataSourceRegisterationResult>;
  getDataSources: (
    filters: IDataSourceFilters
  ) => Record<
    string,
    DataSource<
      IDataSourceMetaData,
      IDataSetParams,
      ISourceDataSet,
      IDataSourceQueryParams,
      IDataSourceQueryResult
    >
  >;
}
