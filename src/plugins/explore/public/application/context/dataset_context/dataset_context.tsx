/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { DataView as Dataset } from 'src/plugins/data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { RootState } from '../../utils/state_management/store';

interface DatasetContextValue {
  dataset: Dataset | undefined;
  isLoading: boolean;
  error: string | null;
}

const DatasetContext = createContext<DatasetContextValue>({
  dataset: undefined,
  isLoading: false,
  error: null,
});

/**
 * Dataset Context Provider
 *
 * Centrally manages Dataset fetching based on the dataset from query slice.
 * This eliminates the need for each component to independently fetch Dataset.
 */
export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [dataset, setDataset] = useState<Dataset | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const datasetFromState = useSelector((state: RootState) => state.query?.dataset);

  useEffect(() => {
    let isMounted = true;

    const fetchDataset = async () => {
      if (!datasetFromState) {
        setDataset(undefined);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let view = await services.data.dataViews.get(
          datasetFromState.id,
          datasetFromState.type !== 'INDEX_PATTERN'
        );

        if (!view) {
          // Cache the dataset first (for INDEX type datasets)
          await services.data.query.queryString.getDatasetService().cacheDataset(datasetFromState, {
            uiSettings: services.uiSettings,
            savedObjects: services.savedObjects,
            notifications: services.notifications,
            http: services.http,
            data: services.data,
          });

          // Try again after caching
          view = await services.data.dataViews.get(
            datasetFromState.id,
            datasetFromState.type !== 'INDEX_PATTERN'
          );
        }

        if (isMounted) {
          if (view) {
            setDataset(view);
          } else {
            const errorMsg = `Failed to fetch dataset: ${datasetFromState.id}`;
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

    fetchDataset();

    return () => {
      isMounted = false;
    };
  }, [datasetFromState, services]);

  const contextValue = useMemo<DatasetContextValue>(
    () => ({
      dataset,
      isLoading,
      error,
    }),
    [dataset, isLoading, error]
  );

  return <DatasetContext.Provider value={contextValue}>{children}</DatasetContext.Provider>;
};

/**
 * Hook to access the Dataset context
 *
 * @returns Dataset context value with dataset, isLoading, and error states
 */
export const useDatasetContext = (): DatasetContextValue => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDatasetContext must be used within a DatasetProvider');
  }
  return context;
};
