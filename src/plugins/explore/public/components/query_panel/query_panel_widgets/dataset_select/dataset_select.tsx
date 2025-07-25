/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DataView } from '../../../../../../data/common';
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

  const handleDatasetSelect = useCallback(
    async (dataView: DataView) => {
      if (!dataView) return;

      try {
        const newDataset = await dataViews.convertToDataset(dataView);
        const initialQuery = queryString.getInitialQueryByDataset(newDataset);

        dispatch(
          setQueryWithHistory({
            ...initialQuery,
            dataset: newDataset,
          })
        );

        queryString.setQuery({
          ...initialQuery,
          dataset: newDataset,
        });
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: 'Error selecting dataset',
        });
      }
    },
    [queryString, dataViews, dispatch, services]
  );

  return <DatasetSelect onSelect={handleDatasetSelect} appName="explore" />;
};
