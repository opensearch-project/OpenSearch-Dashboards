/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** @public **/
export enum SIMPLE_DATA_SOURCE_TYPES {
  DEFAULT = 'data-source',
  EXTERNAL = 'external-source',
}

/** @public **/
export enum SIMPLE_DATA_SET_TYPES {
  INDEX_PATTERN = 'index-pattern',
  TEMPORARY = 'temporary',
  TEMPORARY_ASYNC = 'temporary-async',
}

export interface SimpleObject {
  id?: string;
  title?: string;
  dataSourceRef?: SimpleDataSource;
}

export interface SimpleDataSource {
  id: string;
  name: string;
  indices?: SimpleObject[];
  type: SIMPLE_DATA_SOURCE_TYPES;
}

export interface SimpleDataSet extends SimpleObject {
  fields?: any[];
  timeFieldName?: string;
  timeFields?: any[];
  type?: SIMPLE_DATA_SET_TYPES;
}
