/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD } from './utils/constants';
import { RootState } from '../../application/utils/state_management/store';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { defaultPrepareQuery } from '../../application/utils/state_management/actions/query_actions';

export const PatternsContainer = () => {
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector((state: RootState) => state.ui.activeTabId);
  const results = useSelector((state: RootState) => state.results);
  const services = useOpenSearchDashboards<ExploreServices>().services;

  // Use tab-specific cache key computation
  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry?.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
    const queryString = typeof query.query === 'string' ? query.query : '';
    return prepareQuery(queryString);
  }, [query, activeTabId, services]);

  const rawResults = cacheKey ? results[cacheKey] : null;

  // TODO: Register custom processor for patterns tab if needed
  //       If no need, feel free to remove this comment
  // const tabDefinition = services.tabRegistry?.getTab?.('patterns');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;
  // const processedResults = processor(rawResults, indexPattern);

  const rows = rawResults?.hits?.hits || [];

  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = rows?.map((row) => ({
    pattern: row._source[PATTERNS_FIELD],
    ratio: row._source[COUNT_FIELD] / 2096, // TODO: pull from total hits
    count: row._source[COUNT_FIELD],
  }));

  return <PatternsTable items={items} />;
};
