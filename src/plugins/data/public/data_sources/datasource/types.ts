/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSource } from './datasource';

/**
 * @experimental These interfaces are experimental and might change in future releases.
 */

export interface IndexPatternOption {
  title: string;
  id: string;
}

export interface IDataSourceGroup {
  name: string;
}

export interface DataSetWithDataSource<T = []> {
  ds: DataSource;
  list: T;
}

export interface IDataSetParams<T = {}> {
  query: T;
}

export interface IDataSourceQueryParams<T = {}> {
  query: T;
}

export interface IDataSourceQueryResult<T = {}> {
  data: T;
}

export interface DataSourceConnectionStatus {
  status: string;
  message: string;
  error?: Error;
}

export interface IDataSourceSettings<T extends IDataSourceMetadata = IDataSourceMetadata> {
  id: string;
  type: string;
  name: string;
  metadata: T;
}

export interface IDataSourceMetadata {
  ui: IDataSourceUISettings;
}

export interface IDataSourceUISelector {
  displayDatasetsAsSource: boolean;
}

export interface IDataSourceUISettings {
  selector: IDataSourceUISelector;
  label: string; // the display name of data source
  groupType: DataSourceUIGroupType; // the group to which the data source belongs
  typeLabel: string; // the display name of data source type
  displayOrder?: number; // the order in which the data source should be displayed in selector
  description?: string; // short description of your database
  icon?: string; // uri of the icon
}

export interface IDataSourceDataSet<T = {}> {
  dataSets: T;
}

export interface IDataSourceQueryResponse<T = {}> {
  data: T;
}

export enum DataSourceUIGroupType {
  defaultOpenSearchDataSource = 'DEFAULT_INDEX_PATTERNS',
}
