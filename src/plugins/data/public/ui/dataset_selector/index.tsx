/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect, useRef } from 'react';

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
  const indexPatterns = services.data.indexPatterns;
  const [selectedDataset, setSelectedDataset] = useState<Dataset | undefined>(
    () => queryString.getQuery().dataset || queryString.getDefaultQuery().dataset
  );

  // Enrich dataset with displayName if missing (e.g., from cached URL state)
  useEffect(() => {
    const enrichDataset = async (dataset: Dataset | undefined) => {
      if (!dataset || dataset.displayName) {
        return;
      }
      try {
        const indexPattern = await indexPatterns.get(dataset.id);
        if (indexPattern.displayName) {
          setSelectedDataset((prev) =>
            prev?.id === dataset.id ? { ...prev, displayName: indexPattern.displayName } : prev
          );
        }
      } catch {
        // Index pattern not found, ignore
      }
    };
    enrichDataset(selectedDataset);
  }, [selectedDataset, indexPatterns]);

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
      const languageService = queryString.getLanguageService();
      setSelectedDataset(query.dataset);
      queryString.setQuery(query);
      languageService.setUserQueryLanguage(query.language);
      queryString.getInitialQueryByLanguage(query.language);
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
