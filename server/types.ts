/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPluginSetup } from 'src/plugins/data/server/plugin';
import { DataSourcePluginSetup } from '../../../src/plugins/data_source/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}

export interface QueryEnhancementsPluginSetupDependencies {
  data: DataPluginSetup;
  dataSource?: DataSourcePluginSetup;
}

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
