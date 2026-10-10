/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from '../../../../core/server';
import { isPPLAggregationQuery, queryEndsWithHead } from '../../common/utils';

export const SAMPLE_SIZE_SETTING = 'discover:sampleSize';
export const AGGREGATION_SAMPLE_SIZE_SETTING = 'discover:aggregationSampleSize';

/**
 * Picks the row limit for a PPL query, which the backend lowers to a `head N` over the final result
 * rows. Returns undefined when the query already ends with `head`, since an explicit limit wins.
 *
 * An aggregating query's final rows are buckets, not documents, so it uses its own (larger) sample
 * size: a document-sized cap would silently drop whole buckets, and with a `span()` key the bucket
 * count grows with the time range. Document searches keep `discover:sampleSize`, mirroring DQL where
 * that setting bounds only the doc table.
 */
export const resolvePPLFetchSize = async (
  uiSettings: Pick<IUiSettingsClient, 'get'>,
  query: string
): Promise<number | undefined> => {
  if (queryEndsWithHead(query)) {
    return undefined;
  }
  const setting = isPPLAggregationQuery(query)
    ? AGGREGATION_SAMPLE_SIZE_SETTING
    : SAMPLE_SIZE_SETTING;
  return uiSettings.get<number>(setting);
};
