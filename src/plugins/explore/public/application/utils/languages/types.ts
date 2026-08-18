/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';

export interface PromQLQueryOptions {
  maxDataPoints?: number;
  minStep?: string;
  legendFormat?: string;
}

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
} & PromQLQueryOptions;
