/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchStrategy, PluginSetup } from 'src/plugins/data/server';
import { DataSourcePluginSetup } from 'src/plugins/data_source/server';
import { IDataFrameResponse, IOpenSearchDashboardsSearchRequest } from '../../data/common';
import { BaseConnectionManager } from './connections/managers/base_connection_manager';

export interface QueryEnhancementsPluginSetup {
  defineSearchStrategyRoute: (
    id: string,
    searchStrategy: ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  ) => void;
  registerResourceManager: (dataConnectionType: string, manager: BaseConnectionManager) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}

export interface QueryEnhancementsPluginSetupDependencies {
  data: PluginSetup;
  dataSource?: DataSourcePluginSetup;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStartDependencies {}

export interface ISchema {
  name: string;
  type: string;
}

export interface IPPLDataSource {
  jsonData?: any[];
}

export interface IPPLVisualizationDataSource extends IPPLDataSource {
  data: any;
  metadata: any;
  size: number;
  status: number;
}

export interface IPPLEventsDataSource extends IPPLDataSource {
  schema: ISchema[];
  datarows: any[];
}

export interface FacetResponse {
  success: boolean;
  data: any;
}

export interface FacetRequest {
  body: {
    query: string;
    format?: string;
  };
}

// TODO declaring it in core changes the interface for every reference. we only
// need this declaration in query_enhancements, but it doesn't seem possible
// https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4274
/* declare module '../../../core/server' {
  interface RequestHandlerContext {
    query_assist: {
      logger: Logger;
      configPromise: Promise<ConfigSchema>;
      dataSourceEnabled: boolean;
    };
    data_source_connection: {
      logger: Logger;
      configPromise: Promise<ConfigSchema>;
      dataSourceEnabled: boolean;
    };
  }
} */
