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
  names: string[];
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
