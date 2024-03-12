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

export interface SourceDataSet {
  ds: DataSource;
  data_sets: IndexPatternOption[];
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

export interface ConnectionStatus {
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

export interface IDataSourceUISettings {
  label: string; // the display name of data source
  typeLabel: string; // the display name of data source type
  description?: string; // short description of your database
  icon?: string; // uri of the icon
}

export interface IDataSourceDataSet<T = {}> {
  data_sets: T;
}

export interface IDataSourceQueryResponse<T = {}> {
  data: T;
}
