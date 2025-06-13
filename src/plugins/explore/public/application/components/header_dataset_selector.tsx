/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { DatasetSelector, DatasetSelectorAppearance, Query } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import { clearResults } from '../utils/state_management/slices/results_slice';
import {
  beginTransaction,
  finishTransaction,
} from '../utils/state_management/actions/transaction_actions';
import { setDataset, setQuery } from '../utils/state_management/slices/query_slice';

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

      dispatch(beginTransaction());
      try {
        // EXPLICIT cache clear - separate cache logic
        dispatch(clearResults());

        // Update dataset
        dispatch(setQuery(queryStringState));

        // Execute queries - cache already cleared
        dispatch(executeQueries({ services }) as any);
      } finally {
        dispatch(finishTransaction());
      }
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
