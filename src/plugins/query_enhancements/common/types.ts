/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { PollQueryResultsParams, TimeRange } from '../../data/common';

export interface QueryAggConfig {
  [key: string]: {
    field?: string;
    fixed_interval?: string;
    calendar_interval?: string;
    min_doc_count?: number;
    time_zone?: string;
    [x: number]: string;
  };
}

export interface QueryStatusConfig {
  sessionId: string;
  queryId?: string;
}

export interface EnhancedFetchContext {
  http: CoreSetup['http'];
  path: string;
  signal?: AbortSignal;
  body?: {
    pollQueryResultsParams?: PollQueryResultsParams;
    timeRange?: TimeRange;
  };
}

export interface QueryStatusOptions<T> {
  fetchStatus: () => Promise<T>;
  interval?: number;
  isServer?: boolean;
}

export type FetchFunction<T, P = void> = (params?: P) => Promise<T>;

export interface SQLQueryResponse {
  status: string;
  schema: Array<{ name: string; type: string }>;
  datarows: unknown[][];
  total: number;
  size: number;
}

export enum S3_FIELD_TYPES {
  BOOLEAN = 'boolean',
  BYTE = 'byte',
  SHORT = 'short',
  INTEGER = 'integer',
  INT = 'int',
  LONG = 'long',
  FLOAT = 'float',
  DOUBLE = 'double',
  KEYWORD = 'keyword',
  TEXT = 'text',
  STRING = 'string',
  TIMESTAMP = 'timestamp',
  DATE = 'date',
  DATE_NANOS = 'date_nanos',
  TIME = 'time',
  INTERVAL = 'interval',
  IP = 'ip',
  GEO_POINT = 'geo_point',
  BINARY = 'binary',
  STRUCT = 'struct',
  ARRAY = 'array',
  UNKNOWN = 'unknown', // For unmapped or unsupported types
}
