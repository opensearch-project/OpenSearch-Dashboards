/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

/**
 * Represents the hierarchical structure of data within a data source.
 *
 * @example
 * Example of an OpenSearch cluster with indices
 *
 * const openSearchCluster: DataStructure = {
 *   id: "b18e5f58-cf71-11ee-ad92-2468ce360004",
 *   title: "Production Cluster",
 *   type: "OPENSEARCH",
 *   children: [
 *     {
 *       id: "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.05",
 *       title: "logs-2023.05",
 *       type: "INDEX",
 *       parent: { id: "b18e5f58-cf71-11ee-ad92-2468ce360004", title: "Production Cluster", type: "OPENSEARCH" }
 *     },
 *     {
 *       id: "b18e5f58-cf71-11ee-ad92-2468ce360004::logs-2023.06",
 *       title: "logs-2023.06",
 *       type: "INDEX",
 *       parent: { id: "b18e5f58-cf71-11ee-ad92-2468ce360004", title: "Production Cluster", type: "OPENSEARCH" }
 *     }
 *   ]
 * };
 *
 * Example of an S3 data source with a database and tables:
 *
 * const s3DataSource: DataStructure = {
 *   id: "7d5c3e1c-ae5f-11ee-9c91-1357bd240003",
 *   title: "mys3",
 *   type: "S3,
 *   children: [
 *     {
 *       id: "mys3.defaultDb",
 *       title: "defaultDb",
 *       type: "DATABASE",
 *       parent: { id: "myS3", title: "My S3 Bucket", type: "S3" },
 *       children: [
 *         {
 *           id: "mys3.defaultDb.table1",
 *           title: "table1",
 *           type: "TABLE",
 *           parent: { id: "sales-db", title: "Sales Database", type: "DATABASE" }
 *         },
 *         {
 *           id: "mys3.defaultDb.table2",
 *           title: "table2",
 *           type: "TABLE",
 *           parent: { id: "sales-db", title: "Sales Database", type: "DATABASE" }
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
  /** The type of the data structure, registered by other classes */
  type: string;
  /** Optional reference to the parent data structure */
  parent?: DataStructure;
  /** Optional array of child data structures */
  children?: DataStructure[];
}

/**
 * Defines the structure of a dataset, including its type and reference to a data source.
 * NOTE: For non-index pattern datasets we will append the data source ID to the front of
 * the title of the dataset to ensure we do not have any conflicts. Many clusters could
 * have similar titles and the data plugin assumes unique data set IDs.
 *
 * @example
 * Example of a Dataset for an OpenSearch index
 * const logsIndexDataset: Dataset = {
 *   id: "2e1b1b80-9c4d-11ee-8c90-0242ac120001",
 *   title: "logs-*",
 *   type: "INDEX_PATTERN",
 *   timeFieldName: "@timestamp",
 *   dataSource: {
 *     id: "main-cluster",
 *     title: "Main OpenSearch Cluster",
 *     type: "DEFAULT"
 *   },
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
 *     type: "EXAMPLE_DATASOURCE"
 *   },
 * };
 */
export interface Dataset {
  /** Unique identifier for the dataset, for non-index pattern based datasets, we will append the data source ID if present */
  id: string;
  /** Human-readable name of the dataset that is used to query */
  title: string;
  /** The type of the dataset, registered by other classes */
  type: string;
  /** Optional name of the field used for time-based operations */
  timeFieldName?: string;
  /** Optional reference to the data source */
  dataSource?: DataSource;
}
