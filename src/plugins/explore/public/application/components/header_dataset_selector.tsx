/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DatasetSelector, DatasetSelectorAppearance, Query } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  updateQueryOnly,
  updateDatasetOnly,
  executeHybridQuery,
} from '../utils/state_management/actions/query_actions';
import { clearResults } from '../utils/state_management/slices/results_slice';

export interface HeaderDatasetSelectorProps {
  datasetSelectorRef: React.RefObject<HTMLDivElement>;
}

/**
 * Header dataset selector component for Explore
 * Uses the Data plugin's ConnectedDatasetSelector and syncs with Explore's Redux store
 */
export const HeaderDatasetSelector: React.FC<HeaderDatasetSelectorProps> = ({
  datasetSelectorRef,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle dataset selection - sync with Explore's Redux store
  const handleDatasetSelect = useCallback(
    (query: Query, dateRange?: any) => {
      if (!isMounted.current || !query.dataset) return;

      const queryStringState = services.data.query.queryString.getQuery();

      // Update Redux with separate actions (no transaction needed for single updates)
      dispatch(updateQueryOnly(queryStringState));

      // Clear results cache since dataset changed
      dispatch(clearResults());

      // Execute hybrid query strategy after dataset change
      dispatch(executeHybridQuery({ services }) as any);
    },
    [dispatch, services]
  );

  // Render dataset selector directly (no portal needed since we're already in the right location)
  return (
    <DatasetSelector
      onSubmit={handleDatasetSelect}
      appearance={DatasetSelectorAppearance.Button}
      buttonProps={{
        'data-test-subj': 'exploreHeaderDatasetSelector',
      }}
    />
  );
};
