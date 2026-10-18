/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../data/common';
import { QueryStringContract } from '../../../../data/public';

/**
 * Whether the dataset's type opts out of automatic query runs (DatasetTypeConfig
 * meta.requiresExplicitRun): Explore then runs a query only when the user asks.
 */
export const datasetRequiresExplicitRun = (
  queryString: Pick<QueryStringContract, 'getDatasetService'> | undefined,
  dataset: { type?: Dataset['type'] } | undefined
): boolean => {
  if (!dataset?.type) return false;
  try {
    return (
      queryString?.getDatasetService()?.getType(dataset.type)?.meta?.requiresExplicitRun === true
    );
  } catch {
    return false;
  }
};
