/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';

export interface PerQueryOptions {
  minStep?: string;
  legendFormat?: string;
}

export interface PromQLQueryOptions {
  maxDataPoints?: number;
  perQueryOptions?: PerQueryOptions[];
}

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
} & PromQLQueryOptions;
