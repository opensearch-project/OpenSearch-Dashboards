/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../data/common';
import { DatasetTypeConfig, QueryStringContract } from '../../../../data/public';

/**
 * The registered config of a dataset type, or undefined when the type, the dataset service or the
 * config is missing. A lookup that throws is treated as missing, so callers can read optional
 * hooks without guarding the lookup themselves.
 */
export const getDatasetTypeConfig = (
  queryString: Pick<QueryStringContract, 'getDatasetService'> | undefined,
  datasetType: Dataset['type'] | undefined
): DatasetTypeConfig | undefined => {
  if (!datasetType) return undefined;
  try {
    return queryString?.getDatasetService?.()?.getType(datasetType);
  } catch {
    return undefined;
  }
};

/**
 * Whether the dataset's type opts out of automatic query runs (DatasetTypeConfig
 * meta.requiresExplicitRun): Explore then runs a query only when the user asks.
 *
 * Invariant: every code path that runs a query on its own (page load, a dataset, source type or
 * language switch, a new search, opening a saved search or saved query, filter for value, Metrics
 * previews) must check this first and not run when it returns true. A run the user asks for (Run,
 * a time range update) must not check it.
 */
export const datasetRequiresExplicitRun = (
  queryString: Pick<QueryStringContract, 'getDatasetService'> | undefined,
  dataset: { type?: Dataset['type'] } | undefined
): boolean => getDatasetTypeConfig(queryString, dataset?.type)?.meta?.requiresExplicitRun === true;
