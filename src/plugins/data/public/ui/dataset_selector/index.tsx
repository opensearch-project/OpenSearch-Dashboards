/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect } from 'react';
import React from 'react';
import { Dataset, Query, TimeRange } from '../../../common';
import {
  DatasetSelector,
  DatasetSelectorUsingButtonEmptyProps,
  DatasetSelectorUsingButtonProps,
  DatasetSelectorAppearance,
} from './dataset_selector';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { IDataPluginServices } from '../../types';

interface ConnectedDatasetSelectorProps {
  onSubmit: ((query: Query, dateRange?: TimeRange | undefined) => void) | undefined;
}

const ConnectedDatasetSelector = ({
  onSubmit,
  ...datasetSelectorProps
}: ConnectedDatasetSelectorProps &
  (DatasetSelectorUsingButtonProps | DatasetSelectorUsingButtonEmptyProps)) => {
  const { services } = useOpenSearchDashboards<IDataPluginServices>();
  const queryString = services.data.query.queryString;
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    () => queryString.getQuery().dataset || queryString.getDefaultQuery().dataset
  );

  useEffect(() => {
    const subscription = queryString.getUpdates$().subscribe((query) => {
      setSelectedDataset(query.dataset);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryString]);

  const onSelect = useCallback(
    (partialQuery: Partial<Query>) => {
      const query = queryString.getInitialQuery(partialQuery);
      setSelectedDataset(query.dataset);
      queryString.setQuery(query);
      onSubmit!(query);
    },
    [onSubmit, queryString]
  );

  return (
    <DatasetSelector
      {...datasetSelectorProps}
      selectedDataset={selectedDataset}
      onSelect={onSelect}
      services={services}
    />
  );
};

export {
  ConnectedDatasetSelector as DatasetSelector,
  ConnectedDatasetSelectorProps as DatasetSelectorProps,
  DatasetSelectorAppearance,
};
