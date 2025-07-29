/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { selectQuery } from '../../../../application/utils/state_management/selectors';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const currentQuery = useSelector(selectQuery);

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
      dataViews,
    },
  } = services;

  useEffect(() => {
    let isMounted = true;

    const handleDataset = async () => {
      if (currentQuery.dataset) {
        const dataView = await dataViews.get(
          currentQuery.dataset.id,
          currentQuery.dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );

        if (!dataView) {
          await queryString.getDatasetService().cacheDataset(
            currentQuery.dataset,
            {
              uiSettings: services.uiSettings,
              savedObjects: services.savedObjects,
              notifications: services.notifications,
              http: services.http,
              data: services.data,
            },
            false
          );
        }
      }
    };

    try {
      handleDataset();
    } catch (error) {
      if (isMounted) {
        services.notifications?.toasts.addWarning(
          `Error fetching dataset: ${(error as Error).message}`
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [currentQuery, dataViews, queryString, services]);

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset) => {
      if (!dataset) return;

      try {
        const initialQuery = queryString.getInitialQueryByDataset(dataset);

        queryString.setQuery({
          ...initialQuery,
          query: EMPTY_QUERY.QUERY,
          dataset,
        });

        dispatch(
          setQueryWithHistory({
            ...queryString.getQuery(),
          })
        );
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: 'Error selecting dataset',
        });
      }
    },
    [queryString, dispatch, services]
  );

  return <DatasetSelect onSelect={handleDatasetSelect} appName="explore" />;
};
