/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { stripStatsFromQuery } from '../strip_stats_from_query';
import { getQueryWithSource } from '../get_query_string_with_source';
import { QueryWithQueryAsString } from '../../types';

/**
 * Default PPL query preparation for tabs (removes stats pipe for histogram compatibility)
 */
export const defaultPreparePplQuery = (query: Query): QueryWithQueryAsString => {
  return stripStatsFromQuery(getQueryWithSource(query));
};
