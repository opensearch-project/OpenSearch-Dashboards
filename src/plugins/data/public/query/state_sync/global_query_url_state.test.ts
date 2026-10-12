/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterStateStore } from '../../../common';
import { getFilter } from '../filter_manager/test_helpers/get_stub_filter';
import { getGlobalQueryUrlState } from './global_query_url_state';
import { QueryState } from './types';

describe('global query URL state', () => {
  const time = { from: 'now-15m', to: 'now' };
  const refreshInterval = { pause: true, value: 0 };
  const globalFilter = getFilter(FilterStateStore.GLOBAL_STATE, false, false, 'global', 'value');
  const appFilter = getFilter(FilterStateStore.APP_STATE, false, false, 'app', 'value');
  const state: QueryState = {
    time,
    refreshInterval,
    filters: [globalFilter, appFilter],
    query: {
      language: 'PPL',
      query: 'source = sample-index',
    },
    dataset: {
      id: 'dataset-id',
      title: 'sample-index',
      type: 'INDEXES',
    },
  };

  it('keeps only global time and pinned filter state', () => {
    expect(getGlobalQueryUrlState(state)).toEqual({
      time,
      refreshInterval,
      filters: [globalFilter],
    });
  });
});
