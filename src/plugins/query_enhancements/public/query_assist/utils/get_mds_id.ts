/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IIndexPattern, IndexPattern, IndexPatternsContract } from '../../../../data/public';

export const getMdsDataSourceId = async (
  indexPatterns: IndexPatternsContract,
  indexPattern: IIndexPattern | IndexPattern | string | undefined
): Promise<string | undefined> => {
  if (!indexPattern || typeof indexPattern !== 'object' || !indexPattern.id) {
    return undefined;
  }

  if (indexPattern instanceof IndexPattern) {
    return indexPattern.dataSourceRef?.id;
  }

  return indexPatterns
    .get(indexPattern.id)
    .then((indexPatternEntity) => indexPatternEntity.dataSourceRef?.id);
};
