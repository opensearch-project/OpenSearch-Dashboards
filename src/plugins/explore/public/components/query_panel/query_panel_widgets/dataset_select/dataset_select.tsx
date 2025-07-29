/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset } from '../../../../../../data/common';
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
    },
  } = services;

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset) => {
      if (!dataset) return;

      try {
        const initialQuery = queryString.getInitialQueryByDataset(dataset);

        queryString.setQuery({
          ...initialQuery,
          query: '', // EMPTY QUERY
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
