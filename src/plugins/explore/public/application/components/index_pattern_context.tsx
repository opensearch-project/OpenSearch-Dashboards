/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IndexPattern } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { RootState } from '../utils/state_management/store';

interface IndexPatternContextValue {
  indexPattern: IndexPattern | undefined;
  isLoading: boolean;
  error: string | null;
}

const IndexPatternContext = createContext<IndexPatternContextValue>({
  indexPattern: undefined,
  isLoading: false,
  error: null,
});

/**
 * IndexPattern Context Provider
 *
 * Centrally manages IndexPattern fetching based on the dataset from query slice.
 * This eliminates the need for each component to independently fetch IndexPattern.
 *
 * Similar to Discover's SearchContext but focused only on IndexPattern management.
 */
export const IndexPatternProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get dataset from query slice (similar to how Discover gets it from queryStringManager)
  const dataset = useSelector((state: RootState) => state.query?.dataset);

  useEffect(() => {
    let isMounted = true;

    const fetchIndexPattern = async () => {
      if (!dataset) {
        setIndexPattern(undefined);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the same logic as Discover's useIndexPattern hook
        let pattern = await services.indexPatterns.get(
          dataset.id,
          dataset.type !== 'INDEX_PATTERN'
        );

        if (!pattern) {
          // Cache the dataset first (for INDEX type datasets)
          await services.data.query.queryString.getDatasetService().cacheDataset(dataset, {
            uiSettings: services.uiSettings,
            savedObjects: services.savedObjects,
            notifications: services.notifications,
            http: services.http,
            data: services.data,
          });

          // Try again after caching
          pattern = await services.data.indexPatterns.get(
            dataset.id,
            dataset.type !== 'INDEX_PATTERN'
          );
        }

        if (isMounted) {
          if (pattern) {
            setIndexPattern(pattern);
          } else {
            const errorMsg = `Failed to fetch IndexPattern for dataset: ${dataset.id}`;
            setError(errorMsg);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = `Error fetching IndexPattern: ${(err as Error).message}`;
          setError(errorMsg);
          setIsLoading(false);
        }
      }
    };

    fetchIndexPattern();

    return () => {
      isMounted = false;
    };
  }, [dataset, services]);

  const contextValue: IndexPatternContextValue = {
    indexPattern,
    isLoading,
    error,
  };

  return (
    <IndexPatternContext.Provider value={contextValue}>{children}</IndexPatternContext.Provider>
  );
};

/**
 * Hook to access the IndexPattern context
 *
 * @returns IndexPattern context value with indexPattern, isLoading, and error states
 */
export const useIndexPatternContext = (): IndexPatternContextValue => {
  const context = useContext(IndexPatternContext);
  if (!context) {
    throw new Error('useIndexPatternContext must be used within an IndexPatternProvider');
  }
  return context;
};
