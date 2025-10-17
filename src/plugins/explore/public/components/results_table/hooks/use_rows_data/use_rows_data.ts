/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRawResults } from '../use_raw_results';
import { useDatasetContext } from '../../../../application/context';

export const useRowsData = (): Array<{ [field: string]: any }> => {
  const { dataset } = useDatasetContext();
  const rawResults = useRawResults();

  if (!dataset) {
    return [];
  }

  // TODO: This is inefficient, there has to be a better way
  return (rawResults?.hits?.hits || []).map((hit) => dataset.flattenHit(hit));
};
