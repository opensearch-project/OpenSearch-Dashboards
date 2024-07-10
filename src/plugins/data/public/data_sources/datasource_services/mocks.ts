/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceService } from './datasource_service';
import { DataSourceStart } from './types';
import { DataSourceFactory } from '../datasource';

function createStartContract(): jest.Mocked<DataSourceStart> {
  return {
    dataSourceService: DataSourceService.getInstance(),
    dataSourceFactory: DataSourceFactory.getInstance(),
  };
}

export const dataSourceServiceMock = {
  createStartContract,
};
