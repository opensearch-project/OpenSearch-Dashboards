/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnyAction } from '@reduxjs/toolkit';
import { Dataset, datasetTypeRequiresExplicitRun } from '../../../../data/common';
import { DatasetTypeConfig, QueryStringContract } from '../../../../data/public';
import {
  clearQueryStatusMap,
  clearResults,
  setIsQueryEditorDirty,
} from './state_management/slices';

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
 * language switch, a new search, opening a saved search or saved query, picking a recent query,
 * filter for value, an auto-refresh tick before the user has run the query, the Metrics previews
 * and metric detail) must check this first and not run when it returns true. A run the user asks
 * for (Run, a time range update, a tab switch, "filter for pattern", an assistant action that
 * runs a query) must not check it.
 */
export const datasetRequiresExplicitRun = (
  queryString: Pick<QueryStringContract, 'getDatasetService'> | undefined,
  dataset: { type?: Dataset['type'] } | undefined
): boolean =>
  // The data plugin's rule, on a guarded type lookup. It comes from data/common because many
  // Explore tests replace the data plugin's public module.
  datasetTypeRequiresExplicitRun(getDatasetTypeConfig(queryString, dataset?.type), dataset);

/**
 * What a skipped automatic run leaves behind for a dataset type that requires an explicit Run:
 * the previous results and statuses are cleared (they belong to another query or language) and
 * the editor is marked dirty, so TopNav shows "Update" for the staged query.
 */
export const stageQueryForExplicitRun = (dispatch: (action: AnyAction) => unknown) => {
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(setIsQueryEditorDirty(true));
};
