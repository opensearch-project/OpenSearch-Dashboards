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
  dataSourceId?: string;
}

export interface IDataSourceGroup {
  name: string;
}

export interface DataSetWithDataSource<T = unknown> {
  ds: DataSource;
  list: T[];
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

export enum ConnectionStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
}

export interface DataSourceConnectionStatus {
  status: ConnectionStatus;
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

/**
 * Represents the UI settings for a data source.
 */
export interface IDataSourceUISettings {
  /**
   * Controls UI elements related to data source selector.
   */
  selector: IDataSourceUISelector;

  /**
   * The display name of the data source.
   */
  label: string;

  /**
   * The group to which the data source belongs. This is used to group data sources in the selector.
   */
  groupType: DataSourceUIGroupType;

  /**
   * The display name of the data source type.
   */
  typeLabel: string;

  /**
   * A short description of the data source.
   * @optional
   */
  description?: string;

  /**
   * URI of the icon representing the data source.
   * @optional
   */
  icon?: string;
}

export interface IDataSourceDataSet<T = {}> {
  dataSets: T;
}

export interface IDataSourceQueryResponse<T = {}> {
  data: T;
}

export enum DataSourceUIGroupType {
  defaultOpenSearchDataSource = 'DEFAULT_INDEX_PATTERNS',
  s3glue = 's3glue',
  spark = 'spark',
}
