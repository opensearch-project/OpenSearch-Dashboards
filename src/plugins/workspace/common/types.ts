/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { DirectQueryDatasourceDetails } from 'src/plugins/data_source_management/public';

export type DataSource = Pick<
  DataSourceAttributes,
  'title' | 'description' | 'dataSourceEngineType'
> & {
  // Id defined in SavedObjectAttribute could be single or array, here only should be single string.
  id: string;
};

export type DirectQueryConnection = Pick<
  DirectQueryDatasourceDetails,
  'name' | 'connector' | 'status' | 'description'
> & {
  // DQC parent data source id
  parentId: string;
};

export enum DataSourceConnectionType {
  OpenSearchConnection,
  DirectQueryConnection,
}

export interface DataSourceConnection {
  id: string;
  type: string | undefined;
  parentId?: string;
  connectionType: DataSourceConnectionType;
  name: string;
  description?: string;
  relatedConnections?: DataSourceConnection[];
}
