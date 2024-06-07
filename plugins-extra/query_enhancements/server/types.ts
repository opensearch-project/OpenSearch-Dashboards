/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPluginSetup } from 'src/plugins/data/server/plugin';
import { HomeServerPluginSetup } from 'src/plugins/home/server/plugin';
import { Logger } from '../../../src/core/server';
import { DataSourcePluginStart } from '../../../src/plugins/data_source/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}
export interface QueryEnhancementsPluginSetupDependencies {
  data: DataPluginSetup;
  dataSource?: DataSourcePluginStart;
}

export interface ISchema {
  name: string;
  type: string;
}

export interface IPPLVisualizationDataSource {
  data: any;
  metadata: any;
  jsonData?: any[];
  size: number;
  status: number;
}

export interface IPPLEventsDataSource {
  schema: ISchema[];
  datarows: any[];
  jsonData?: any[];
}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    query_assist: {
      logger: Logger;
      dataSourceEnabled: boolean;
    };
  }
}
