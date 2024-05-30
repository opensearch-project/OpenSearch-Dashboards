/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPluginSetup } from 'src/plugins/data/server/plugin';
import { HomeServerPluginSetup } from 'src/plugins/home/server/plugin';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueryEnhancementsPluginStart {}
export interface QueryEnhancementsPluginSetupDependencies {
  data: DataPluginSetup;
  home?: HomeServerPluginSetup;
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
