/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IIndexPattern, IndexPatternsContract } from '../../../../../src/plugins/data/public';

export const getMdsDataSourceId = async (
  indexPatterns: IndexPatternsContract,
  indexPattern: IIndexPattern | string | undefined
): Promise<string | undefined> => {
  if (!indexPattern || typeof indexPattern !== 'object' || !indexPattern.id) return undefined;
  return indexPatterns
    .get(indexPattern.id)
    .then((indexPatternEntity) => indexPatternEntity.dataSourceRef?.id);
};
