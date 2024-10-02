/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { DataConnectionSavedObjectAttributes } from 'src/plugins/data_source/common/data_connections';
import { DataConnectionType } from '../../data_source/common';

export type DataSource = Pick<
  DataSourceAttributes,
  'title' | 'description' | 'dataSourceEngineType' | 'type'
> & {
  // Id defined in SavedObjectAttribute could be single or array, here only should be single string.
  id: string;
};

export type DataConnection = Pick<DataConnectionSavedObjectAttributes, 'title'> & {
  type: string;
  id: string;
  connectionType: DataConnectionType;
  description?: string;
  title: string;
};

export enum DataSourceConnectionType {
  OpenSearchConnection,
  DirectQueryConnection,
  DataConnection,
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
