/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns true when the user query contains a stats/aggregation pipe.
 */
export const hasStatsPipe = (queryString: string): boolean => /\|\s*stats\s/i.test(queryString);
