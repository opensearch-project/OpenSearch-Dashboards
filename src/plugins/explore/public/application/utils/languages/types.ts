/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';
import type { PromQLQueryOptions } from '../../../../../query_enhancements/common';

export type { PerQueryOptions, PromQLQueryOptions } from '../../../../../query_enhancements/common';

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
} & PromQLQueryOptions;
