/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';

// PromQL/metrics-only panel settings that ride on the query object. Other
// languages leave them unset.
export interface PromQLQueryOptions {
  maxDataPoints?: number;
  minStep?: string;
}

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
} & PromQLQueryOptions;
