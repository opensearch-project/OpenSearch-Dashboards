/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns a polling strategy based off of the data source type, which is meant to be given as
 * an option during fetching.
 */

export function dataSourceFetchingStrategy(dataSource: string): string {
  if (dataSource === 's3glue') return 'polling';
  return 'default';
}
