/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';

export interface LanguageQueryOptions {
  maxDataPoints?: number;
  /** One entry per query segment, in segment order. The entry shape belongs to the language,
   * so narrow it there rather than naming a language's fields here. */
  perQueryOptions?: unknown[];
}

export type QueryWithQueryAsString = Omit<Query, 'query'> & {
  query: string;
} & LanguageQueryOptions;
