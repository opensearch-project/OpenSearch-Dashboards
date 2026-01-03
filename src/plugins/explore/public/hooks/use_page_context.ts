/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getServices } from '../services/services';
import { RootState } from '../application/utils/state_management/store';

export interface PageContext {
  /** Current query string */
  query: string;
  /** Current time range */
  timeRange: {
    from: string;
    to: string;
  };
  /** Current index pattern */
  indexPattern?: {
    id: string;
    title: string;
    fields: Array<{
      name: string;
      type: string;
    }>;
  };
  /** Current filters applied */
  filters: any[];
  /** Current data source */
  dataSource?: {
    id: string;
    title: string;
  };
  /** Current tab/flavor context */
  tabContext: {
    flavor: string;
    tabId: string;
  };
}

/**
 * Hook that provides current page context including query, filters, time range, and index pattern
 * This is Layer 1 of the 3-layer context system for smart actions
 */
export const usePageContext = (): PageContext => {
  const services = getServices();

  // Get current query and filters from Redux store with error handling
  const exploreState = useSelector((state: RootState) => state.explore);
  const query = exploreState?.query;
  const filters = exploreState?.filters;
  const indexPatternId = exploreState?.indexPattern;
  const dataSourceId = exploreState?.dataSource?.id;
  const currentTab = exploreState?.currentTab;

  console.log('🔍 usePageContext - Redux state:', {
    exploreState,
    query,
    filters,
    indexPatternId,
    dataSourceId,
    currentTab,
  });

  // Get time range from data plugin
  const timefilter = services.data.query.timefilter.timefilter;

  return useMemo(() => {
    let timeRange;
    try {
      timeRange = timefilter.getTime();
    } catch (error) {
      console.warn('usePageContext: Failed to get time range, using defaults:', error);
      timeRange = { from: 'now-15m', to: 'now' };
    }

    // Get index pattern details if available
    let indexPattern;
    if (indexPatternId && services.data.indexPatterns) {
      try {
        // Note: This is synchronous access to cached index patterns
        const cachedIndexPattern = services.data.indexPatterns.getDefault();
        if (cachedIndexPattern) {
          indexPattern = {
            id: cachedIndexPattern.id || '',
            title: cachedIndexPattern.title,
            fields:
              cachedIndexPattern.fields?.map((field) => ({
                name: field.name,
                type: field.type,
              })) || [],
          };
        }
      } catch (error) {
        // Index pattern not available, continue without it
        console.debug('Index pattern not available in cache:', error);
      }
    }

    // Get data source details if available
    let dataSource;
    if (dataSourceId) {
      dataSource = {
        id: dataSourceId,
        title: dataSourceId, // Fallback to ID if title not available
      };
    }

    // Get current tab context
    const tabContext = {
      flavor: currentTab?.flavor || 'logs',
      tabId: currentTab?.id || 'default',
    };

    // Create safe context object with all fallbacks
    const pageContext = {
      query: (typeof query === 'object' ? query?.query : query) || '',
      timeRange: {
        from: timeRange?.from || 'now-15m',
        to: timeRange?.to || 'now',
      },
      indexPattern,
      filters: filters || [],
      dataSource,
      tabContext,
    };

    console.log('📋 usePageContext - Final context:', pageContext);

    return pageContext;
  }, [query, filters, indexPatternId, dataSourceId, currentTab, timefilter]);
};
