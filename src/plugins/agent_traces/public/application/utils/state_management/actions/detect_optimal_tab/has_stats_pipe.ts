/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns true when the user query contains a stats/aggregation pipe.
 */
export const hasStatsPipe = (queryString: string): boolean => /\|\s*stats\s/i.test(queryString);

/**
 * Whether the query belongs on the Visualization tab. Only a stats query renders there, so this
 * one rule decides both which tab to open and whether initial load prefetches the Visualization
 * query.
 */
export const isVisualizationTabTarget = (queryString: string): boolean => hasStatsPipe(queryString);
