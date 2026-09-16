/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isFilterPinned } from '../../../common';
import { QueryState } from './types';

export type GlobalQueryUrlState = Pick<QueryState, 'time' | 'refreshInterval' | 'filters'>;

/**
 * Projects the shared query service state onto the fields owned by `_g`.
 *
 * `data.query.state$` also contains app-local query, dataset, and filter state. Callers must select
 * `_g` fields explicitly instead of spreading the full state, or app-local state can leak into
 * other applications through their tracked URLs.
 */
export const getGlobalQueryUrlState = ({
  time,
  refreshInterval,
  filters,
}: QueryState): GlobalQueryUrlState => ({
  time,
  refreshInterval,
  filters: filters?.filter(isFilterPinned),
});
