/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CORE_SIGNAL_TYPES, Dataset, DEFAULT_DATA } from '../../../../data/common';
import type { QueryStringContract, SavedQuery, SavedQueryService } from '../../../../data/public';

const INDEX_DATASET_TYPES: string[] = [
  DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  DEFAULT_DATA.SET_TYPES.INDEX,
];

const definedOnly = <T extends Record<string, unknown>>(object: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

/**
 * Whether a saved query can keep this dataset, i.e. the saved query mapping holds every field the
 * page needs to use it again. Kept out:
 *
 * - an index pattern or index, as always: PPL and SQL name their index in the query, and loading
 *   such a query keeps the dataset on screen;
 * - a Metrics or Traces dataset (`signalType`). The mapping has no `signalType` field, so a stored
 *   copy comes back without it, and those pages take only a dataset that has their own signal
 *   type (redux_persistence's resolveDataset): on a reload the page would reject the dataset it
 *   was loaded with and resolve another one, losing the query with it. They resolve their own
 *   dataset anyway, so such a saved query loads on the dataset on screen, as it did before saved
 *   queries kept one. A Logs dataset is kept: the Logs page takes a dataset with no signal type.
 *
 * Anything else (a registered source's dataset, e.g. a set of log groups) is kept, since its query
 * doesn't say what it runs on.
 */
const SIGNAL_TYPES_A_PAGE_REQUIRES: string[] = [
  CORE_SIGNAL_TYPES.METRICS,
  CORE_SIGNAL_TYPES.TRACES,
];

const savedQueryCanKeepDataset = (dataset: Dataset | undefined): dataset is Dataset =>
  !!dataset?.type &&
  !INDEX_DATASET_TYPES.includes(dataset.type) &&
  !SIGNAL_TYPES_A_PAGE_REQUIRES.includes(dataset.signalType ?? '');

/**
 * The dataset a saved query keeps, or undefined for none (savedQueryCanKeepDataset). Only the
 * fields the saved query mapping has are kept (the mapping is strict).
 */
export const getDatasetForSavedQuery = (dataset: Dataset | undefined): Dataset | undefined => {
  if (!savedQueryCanKeepDataset(dataset)) return undefined;
  const { id, title, type, timeFieldName, language, dataSource } = dataset;
  return definedOnly({
    id,
    title,
    type,
    timeFieldName,
    language,
    dataSource: dataSource
      ? (definedOnly({
          id: dataSource.id,
          title: dataSource.title,
          type: dataSource.type,
          // Not the meta's `sessionId`: it belongs to one session, and a saved query is shared.
          meta: dataSource.meta
            ? definedOnly({ name: (dataSource.meta as Record<string, unknown>).name })
            : undefined,
        }) as Dataset['dataSource'])
      : undefined,
  }) as Dataset;
};

/**
 * The dataset a saved query was stored with, when Explore should switch to it on load: one that
 * isn't an index pattern or index, of a type that is still registered.
 *
 * The saved queries flyout hands over the query with the dataset on screen in place of the stored
 * one, so the stored dataset is read from the saved object again.
 */
export const getStoredSavedQueryDataset = async (
  savedQueryService: Pick<SavedQueryService, 'getSavedQuery'>,
  queryString: Pick<QueryStringContract, 'getDatasetService'> | undefined,
  savedQuery: SavedQuery
): Promise<Dataset | undefined> => {
  let stored: Dataset | undefined;
  try {
    stored = (await savedQueryService.getSavedQuery(savedQuery.id))?.attributes?.query?.dataset;
  } catch {
    return undefined;
  }
  // A stored dataset the page could not use again (savedQueryCanKeepDataset) is not switched to:
  // such a saved query loads on the dataset on screen.
  if (!savedQueryCanKeepDataset(stored)) return undefined;
  try {
    if (!queryString?.getDatasetService?.()?.getType(stored.type)) return undefined;
  } catch {
    return undefined;
  }
  return stored;
};
