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

// Index patterns can carry a large `attributes.fields` mapping blob, so responses are
// projected to `signalType` only, keeping each response in the KB range instead of the
// full (potentially multi-MB) documents. A high page size resolves typical workspaces in
// a single round-trip; the pagination below preserves correctness for larger ones.
const PER_PAGE = 10000;

/**
 * Fetch every index pattern's signal type in a single paginated, projected query.
 *
 * Returns one entry per index pattern with its `signalType` and resolved `dataSourceId`.
 * Callers derive whatever they need from the list (e.g. a `Map<id, signalType>` or a
 * `Set<dataSourceId>` of datasources that already have a trace dataset).
 */
export const getIndexPatternSignalTypes = async (
  savedObjectsClient: SavedObjectsClientContract
): Promise<IndexPatternSignalType[]> => {
  const collected: IndexPatternSignalType[] = [];
  let page = 1;
  let total = Infinity;

  // Paginate until every index pattern has been read. `total` bounds the loop and the
  // empty-page guard defends against a backend that omits or misreports `total`.
  // A stable sort keeps page boundaries deterministic so patterns are neither skipped
  // nor duplicated across pages.
  while (collected.length < total) {
    let response;
    try {
      response = await savedObjectsClient.find<{ signalType?: string }>({
        type: 'index-pattern',
        fields: ['signalType'],
        perPage: PER_PAGE,
        page,
        sortField: 'updated_at',
        sortOrder: 'desc',
      });
    } catch {
      // On a failed page, return the patterns already read rather than discarding them:
      // a partial signal-type map is still usable and safer than losing everything.
      break;
    }

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
