/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SearchResponse } from 'elasticsearch';
import {
  OpenSearchDashboardsDatatable,
  ExpressionFunctionDefinition,
} from '../../../../expressions/common';

export type OpenSearchSearchHit<T = unknown> = SearchResponse<T>['hits']['hits'][number] & {
  isAnchor?: boolean;
};

type Input = null;
type Output = Promise<OpenSearchDashboardsDatatable>;

interface Arguments {
  hits: string;
  timeField: string;
}

export type DiscoverSearchExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'discoverSearch',
  Input,
  Arguments,
  Output
>;
