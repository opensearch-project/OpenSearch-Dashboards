/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { DataView, DEFAULT_DATA } from '../../../../../data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { RootState } from '../../utils/state_management/store';

interface DatasetContextValue {
  dataset: DataView | undefined;
  isLoading: boolean | null;
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
  const {
    dataViews,
    query: { queryString },
  } = services.data;
  const [dataset, setDataset] = useState<DataView | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean | null>(null);
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
        let dataView = await dataViews.get(
          datasetFromState.id,
          datasetFromState.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );
        if (!dataView) {
          await queryString.getDatasetService().cacheDataset(
            datasetFromState,
            {
              uiSettings: services.uiSettings,
              savedObjects: services.savedObjects,
              notifications: services.notifications,
              http: services.http,
              data: services.data,
            },
            false
          );

          dataView = await dataViews.get(
            datasetFromState.id,
            datasetFromState.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
          );
        }

        if (!isMounted) return;

        setDataset(dataView || undefined);
        setError(dataView ? null : `Failed to fetch dataset: ${datasetFromState.id}`);
      } catch (err) {
        if (!isMounted) return;
        setError(`Error fetching dataset: ${(err as Error).message}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDataset();

    return () => {
      isMounted = false;
    };
  }, [datasetFromState, dataViews, queryString, services]);

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
