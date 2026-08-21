/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from 'src/core/public';
import { getDataSourceIdFromIndexPattern } from '../../../data/common';

/**
 * A lightweight view of an index pattern used for signal-type routing on page load.
 * `dataSourceId` is resolved with {@link getDataSourceIdFromIndexPattern}, which
 * handles both the `references` array and ids that encode the data source
 * (`<dataSourceId>::<...>` / `<dataSourceId>_<uuid>`).
 */
export interface IndexPatternSignalType {
  id: string;
  signalType?: string;
  dataSourceId?: string;
}

// Index patterns can carry a large `attributes.fields` mapping blob, so we always
// project to `signalType` only — the server honors the projection, keeping each
// response in the KB range instead of the full (potentially multi-MB) documents.
// A high page size keeps the number of round-trips low for typical workspaces while
// pagination below guarantees correctness when a workspace exceeds a single page.
const PER_PAGE = 10000;

/**
 * Fetch every index pattern's signal type in a single paginated, projected query.
 *
 * This replaces the previous per-pattern `indexPatterns.get(id)` loops on page load,
 * which produced an N+1 of `_bulk_get` calls (one per pattern) and repeatedly resolved
 * the same data source via the uncached `getDataSource`. Callers should fetch this once
 * and derive whatever they need (e.g. a `Map<id, signalType>` or a `Set<dataSourceId>`
 * of datasources that already have a trace dataset).
 */
export const getIndexPatternSignalTypes = async (
  savedObjectsClient: SavedObjectsClientContract
): Promise<IndexPatternSignalType[]> => {
  const collected: IndexPatternSignalType[] = [];
  let page = 1;
  let total = Infinity;

  // Paginate until every index pattern has been read, so correctness does not depend
  // on a single-page cap. `total` bounds the loop; the empty-page guard defends against
  // a backend that omits or misreports `total`.
  while (collected.length < total) {
    const response = await savedObjectsClient.find<{ signalType?: string }>({
      type: 'index-pattern',
      fields: ['signalType'],
      perPage: PER_PAGE,
      page,
    });

    response.savedObjects.forEach((savedObject) => {
      collected.push({
        id: savedObject.id,
        signalType: savedObject.attributes?.signalType,
        dataSourceId: getDataSourceIdFromIndexPattern(savedObject),
      });
    });

    if (response.savedObjects.length === 0) {
      break;
    }
    total = response.total ?? collected.length;
    page += 1;
  }

  return collected;
};
