/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ActionByType, createAction } from '../../../ui_actions/public';
import { Query, TimefilterContract, TimeRange } from '..';
import { QueryStringContract } from '../query/query_string';

export const ACTION_GLOBAL_APPLY_QUERY = 'ACTION_GLOBAL_APPLY_QUERY';

export interface ApplyGlobalQueryActionContext {
  query: Query;
  dateRange?: TimeRange;
  timeFieldName?: string;
}

async function isCompatible(context: ApplyGlobalQueryActionContext) {
  return context.query !== undefined;
}

export function createQueryAction(
  queryString: QueryStringContract,
  timeFilter: TimefilterContract
): ActionByType<typeof ACTION_GLOBAL_APPLY_QUERY> {
  return createAction<typeof ACTION_GLOBAL_APPLY_QUERY>({
    type: ACTION_GLOBAL_APPLY_QUERY,
    id: ACTION_GLOBAL_APPLY_QUERY,
    order: 100,
    getIconType: () => 'search',
    getDisplayName: () => {
      return i18n.translate('data.filter.applyFilterActionTitle', {
        defaultMessage: 'Apply query to current view',
      });
    },
    isCompatible,
    execute: async (context: ApplyGlobalQueryActionContext) => {
      queryString.setQuery(context.query);
      if (context.dateRange) {
        timeFilter.setTime(context.dateRange);
      }
    },
  });
}
