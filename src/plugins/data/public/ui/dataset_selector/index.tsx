/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect } from 'react';
import React from 'react';
import { Dataset, Query, TimeRange } from '../../../common';
import {
  DatasetSelector,
  DatasetSelectorUsingButtonEmptyProps,
  DatasetSelectorUsingButtonProps,
  DatasetSelectorAppearance,
} from './dataset_selector';
import { AdvancedSelector } from './advanced_selector';

interface ConnectedDatasetSelectorProps {
  onSubmit: ((query: Query, dateRange?: TimeRange | undefined) => void) | undefined;
  selectedDataset?: Dataset;
  setSelectedDataset: (data: Dataset | undefined) => void;
  setIndexPattern: (id: string | undefined) => void;
  services?: any;
}

const ConnectedDatasetSelector = ({
  onSubmit,
  selectedDataset,
  setSelectedDataset,
  setIndexPattern,
  services,
  ...datasetSelectorProps
}: ConnectedDatasetSelectorProps &
  (DatasetSelectorUsingButtonProps | DatasetSelectorUsingButtonEmptyProps)) => {
  const queryString = services.data.query.queryString;

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
      setIndexPattern(query.dataset?.id);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString, setSelectedDataset, setIndexPattern]);

  const handleDatasetChange = useCallback(
    (dataset?: Dataset) => {
      setSelectedDataset(dataset);
      setIndexPattern(dataset?.id);
      if (dataset) {
        const query = queryString.getInitialQueryByDataset(dataset);
        queryString.setQuery(query);
        onSubmit!(queryString.getQuery());
        queryString.getDatasetService().addRecentDataset(dataset);
      }
    },
    [onSubmit, queryString, setSelectedDataset, setIndexPattern]
  );

  return (
    <DatasetSelector
      {...datasetSelectorProps}
      selectedDataset={selectedDataset}
      setSelectedDataset={setSelectedDataset}
      setIndexPattern={setIndexPattern}
      handleDatasetChange={handleDatasetChange}
      services={services}
    />
  );
};

export { ConnectedDatasetSelector as DatasetSelector, AdvancedSelector, DatasetSelectorAppearance };
