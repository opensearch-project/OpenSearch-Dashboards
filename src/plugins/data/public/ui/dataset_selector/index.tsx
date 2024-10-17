/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect } from 'react';
import React from 'react';
import { Dataset, Query, TimeRange } from '../../../common';
import { DatasetSelector } from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';
import { AdvancedSelector } from './advanced_selector';

interface ConnectedDatasetSelectorProps {
  onSubmit: ((query: Query, dateRange?: TimeRange | undefined) => void) | undefined;
  selectedDataset?: Dataset;
  setSelectedDataset?: any;
  dispatch?: any;
}

const ConnectedDatasetSelector = ({
  onSubmit,
  selectedDataset,
  setSelectedDataset,
  dispatch,
}: ConnectedDatasetSelectorProps) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      dispatch(setSelectedDataset(query.dataset));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString, setSelectedDataset, dispatch]);

  const handleDatasetChange = useCallback(
    (dataset?: Dataset) => {
      dispatch(setSelectedDataset(dataset));
      if (dataset) {
        const query = queryString.getInitialQueryByDataset(dataset);
        queryString.setQuery(query);
        onSubmit!(queryString.getQuery());
        queryString.getDatasetService().addRecentDataset(dataset);
      }
    },
    [onSubmit, queryString, setSelectedDataset, dispatch]
  );

  return (
    <DatasetSelector
      selectedDataset={selectedDataset}
      setSelectedDataset={setSelectedDataset}
      handleDatasetChange={handleDatasetChange}
      services={services}
      dispatch={dispatch}
    />
  );
};

export { ConnectedDatasetSelector as DatasetSelector, AdvancedSelector };
