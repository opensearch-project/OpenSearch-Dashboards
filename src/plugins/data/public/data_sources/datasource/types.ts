/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPatternsContract } from '../../index_patterns';
import { DataSourceType } from '../datasource_services';

export interface IDataSourceMetaData {
  name: string;
}

export interface IDataSourceGroup {
  name: string;
}

export interface ISourceDataSet {
  ds: DataSourceType;
  data_sets: string[] | IndexPatternsContract;
}

export interface IDataSetParams {}

export interface IDataSourceQueryParams {}

export interface IDataSourceQueryResult {}

export interface ConnectionStatus {
  success: boolean;
  info: string;
}
