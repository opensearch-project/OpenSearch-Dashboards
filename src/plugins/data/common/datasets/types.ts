/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIconProps } from '@elastic/eui';
export * from './_structure_cache';

/**
 * Describes a data source with its properties.
 */
export interface DataSource {
  /** Optional unique identifier for the data source, if MDS enabled this is the ID used to fetch the data source */
  id?: string;
  /** Human-readable name of the data source */
  title: string;
  /** The engine type of the data source */
  type: string;
  /** Optional metadata for the data source */
  meta?: DataSourceMeta;
}

/**
 * Metadata for a data source, generic to allow for additional fields.
 */
export interface DataSourceMeta {
  /** Optional name used for specific purposes like async query sources */
  name?: string;
  /** Optional session ID for faster responses when utilizing async query sources */
  sessionId?: string;
  /** Optional supportsTimeFilter determines if a time filter is needed */
  supportsTimeFilter?: boolean;
}

/**
 * Represents the hierarchical structure of data within a data source.
 *
 * @example
 *
 * const openSearchCluster: DataStructure = {
 *   id: "b18e5f58-cf71-11ee-ad92-2468ce360004",
 *   title: "Data Cluster1",
 *   type: "DATA_SOURCE",
 *   children: [
 *     {
 *       id: "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.05",
 *       title: "logs-2023.05",
 *       type: "INDEX",
 *       parent: { id: "b18e5f58-cf71-11ee-ad92-2468ce360004", title: "Data Cluster1", type: "DATA_SOURCE" },
 *       meta: {
 *         type: 'FEATURE',
 *         icon: 'indexIcon',
 *         tooltip: 'Logs from May 2023'
 *       }
 *     },
 *     {
 *       id: "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.06",
 *       title: "logs-2023.06",
 *       type: "INDEX",
 *       parent: { id: "b18e5f58-cf71-11ee-ad92-2468ce360004", title: "Data Cluster1", type: "DATA_SOURCE" },
 *       meta: {
 *         type: 'FEATURE',
 *         icon: 'indexIcon',
 *         tooltip: 'Logs from June 2023'
 *       }
 *     }
 *   ],
 *   meta: {
 *     type: 'FEATURE',
 *     icon: 'clusterIcon',
 *     tooltip: 'OpenSearch Cluster'
 *   }
 * };
 *
 * Example of an S3 data source with a connection, database, and tables:
 *
 * const s3DataSource: DataStructure = {
 *   id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003",
 *   title: "Flint MDS cluster name",
 *   type: "DATA_SOURCE",
 *   children: [
 *     {
 *       id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3",
 *       title: "mys3",
 *       type: "CONNECTION",
 *       parent: { id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003", title: "Flint MDS cluster name", type: "DATA_SOURCE" },
 *       children: [
 *         {
 *           id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb",
 *           title: "defaultDb",
 *           type: "DATABASE",
 *           parent: { id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3", title: "mys3", type: "CONNECTION" },
 *           children: [
 *             {
 *               id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb.table1",
 *               title: "table1",
 *               type: "TABLE",
 *               parent: { id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb", title: "defaultDb", type: "DATABASE" }
 *             },
 *             {
 *               id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb.table2",
 *               title: "table2",
 *               type: "TABLE",
 *               parent: { id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb", title: "defaultDb", type: "DATABASE" }
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * };
 */
export interface DataStructure {
  /** Unique identifier for the data structure. */
  id: string;
  /** Human-readable name of the data structure */
  title: string;
  /** The type of the data structure */
  type: string;
  /** Optional reference to the parent data structure */
  parent?: DataStructure;
  /** Optional array of child data structures */
  children?: DataStructure[];
  hasNext?: boolean;
  paginationToken?: string;
  multiSelect?: boolean;
  columnHeader?: string;
  /** Optional metadata for the data structure */
  meta?: DataStructureMeta;
}

/**
 * DataStructureMeta types
 */
export enum DATA_STRUCTURE_META_TYPES {
  FEATURE = 'FEATURE',
  TYPE = 'TYPE',
  CUSTOM = 'CUSTOM',
}

/**
 * Metadata for a data structure, used for additional properties like icons or tooltips.
 */
export interface DataStructureFeatureMeta {
  type: DATA_STRUCTURE_META_TYPES.FEATURE;
  icon?: EuiIconProps;
  tooltip?: string;
}

/**
 * Metadata for dataset type
 */
export interface DataStructureDataTypeMeta {
  type: DATA_STRUCTURE_META_TYPES.TYPE;
  icon: EuiIconProps;
  tooltip: string;
}

/**
 * Metadata for a data structure with CUSTOM type, allowing any additional fields.
 */
export interface DataStructureCustomMeta {
  type: DATA_STRUCTURE_META_TYPES.CUSTOM;
  icon?: EuiIconProps;
  tooltip?: string;
  [key: string]: any;
}

/**
 * Union type for DataStructureMeta
 */
export type DataStructureMeta =
  | DataStructureFeatureMeta
  | DataStructureDataTypeMeta
  | DataStructureCustomMeta;

/**
 * Represents a cached version of DataStructure with string references instead of object references.
 *
 * @example
 *
 * const cachedOpenSearchCluster: CachedDataStructure = {
 *   id: "b18e5f58-cf71-11ee-ad92-2468ce360004",
 *   title: "Data Cluster1",
 *   type: "DATA_SOURCE",
 *   parent: "",
 *   children: [
 *     "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.05",
 *     "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.06"
 *   ]
 * };
 */
export interface CachedDataStructure extends Omit<DataStructure, 'parent' | 'children'> {
  /** ID of the parent data structure */
  parent: string;
  /** Array of child data structure IDs */
  children: string[];
}

export interface BaseDataset {
  /** Unique identifier for the dataset, for non-index pattern based datasets, we will append the data source ID if present */
  id: string;
  /** Human-readable name of the dataset that is used to query */
  title: string;
  /** The type of the dataset, registered by other classes */
  type: string;
  /** Optional reference to the data source */
  dataSource?: DataSource;
}

/**
 * Defines the structure of a dataset, including its type and reference to a data source.
 * NOTE: For non-index pattern datasets we will append the data source ID to the front of
 * the title of the dataset to ensure we do not have any conflicts. Many clusters could
 * have similar titles and the data plugin assumes unique data set IDs.
 *
 * @example
 * Example of a Dataset for an OpenSearch index pattern
 * const logsIndexDataset: Dataset = {
 *   id: "2e1b1b80-9c4d-11ee-8c90-0242ac120001",
 *   title: "logs-*",
 *   type: "INDEX_PATTERN",
 *   timeFieldName: "@timestamp",
 *   dataSource: {
 *     id: "2e1b1b80-9c4d-11ee-8c90-0242ac120001",
 *     title: "Cluster1",
 *     type: "OpenSearch"
 *   }
 * };
 *
 * @example
 * Example of a Dataset for an S3 table
 * const ordersTableDataset: Dataset = {
 *   id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003::mys3.defaultDb.table1",
 *   title: "mys3.defaultDb.table1",
 *   type: "S3",
 *   timeFieldName: "order_date",
 *   dataSource: {
 *     id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003",
 *     title: "My S3 Connect",
 *     type: "S3_GLUE"
 *   },
 * };
 */
export interface Dataset extends BaseDataset {
  /** Optional name of the field used for time-based operations */
  timeFieldName?: string;
  /** Optional language to default to from the language selector */
  language?: string;
  /** Optional reference to the source dataset. Example usage is for indexed views to store the
   * reference to the table dataset
   */
  sourceDatasetRef?: {
    id: string;
    type: string;
  };
}

export interface DatasetField {
  name: string;
  type: string;
  displayName?: string;
  // TODO:  osdFieldType?
}

export interface DatasetSearchOptions {
  strategy?: string;
}
