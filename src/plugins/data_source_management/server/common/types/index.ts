/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
