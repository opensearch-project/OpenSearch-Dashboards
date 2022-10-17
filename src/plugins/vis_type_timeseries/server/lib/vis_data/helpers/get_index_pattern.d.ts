/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReqFacade } from '../../search_strategies/strategies/abstract_search_strategy';

export function getIndexPatternObject(
  requestContext: ReqFacade,
  indexPattern: string
): Promise<{
  indexPatternObject: any;
  indexPatternString: string;
  dataSourceId?: string;
}>;
