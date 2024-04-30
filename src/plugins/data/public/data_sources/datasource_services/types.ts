/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @experimental These interfaces, types and classes are experimental and might change
 * in future releases.
 */

import { DataSourceFactory } from '../datasource';
import { DataSourceService } from './datasource_service';

export interface IDataSourceFilter {
  ids?: string[]; // Array of data source IDs to filter by
  names?: string[]; // Array of data source names to filter by
  types?: string[]; // Array of data source types to filter by
}

export interface IDataSourceRegistrationResult {
  success: boolean;
  info: string;
}

export class DataSourceRegistrationError extends Error {
  success: boolean;
  info: string;
  constructor(message: string) {
    super(message);
    this.success = false;
    this.info = message;
  }
}

export interface DataSourceStart {
  dataSourceService: DataSourceService;
  dataSourceFactory: DataSourceFactory;
}

export interface DataSourceFetcher {
  type: string;
  registerDataSources: () => void;
}
