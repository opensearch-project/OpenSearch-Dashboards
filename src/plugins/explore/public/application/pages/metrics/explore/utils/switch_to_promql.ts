/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Query } from '../../../../../../../data/common';
import type { ExploreServices } from '../../../../../types';
import { setQueryWithHistory } from '../../../../utils/state_management/slices';
import type { AppDispatch } from '../../../../utils/state_management/store';

/**
 * Makes `promql` the active PromQL query when another language is active, so a query the metric
 * browser builds doesn't run as, say, a source's SQL-like metrics language. The other language's
 * query options are dropped, as when switching with the language picker. A no-op on PromQL.
 */
export const switchToPromQL = (
  services: ExploreServices,
  dispatch: AppDispatch,
  activeLanguage: string | undefined,
  promql: string
): void => {
  if (activeLanguage === 'PROMQL') return;
  const queryString = services.data.query.queryString;
  queryString.getLanguageService().setUserQueryLanguage('PROMQL');
  queryString.setQuery({
    query: promql,
    language: 'PROMQL',
    // Query has no `queryOptions` in its type; languages such as PromQL keep their options there.
    queryOptions: undefined,
  } as Partial<Query>);
  dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
};
