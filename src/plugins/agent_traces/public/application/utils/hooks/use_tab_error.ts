/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { selectQueryStatusMap, selectSort } from '../state_management/selectors';

/**
 * Hook for reading tab error from QueryStatusMap
 */
export const useTabError = (registryTab?: TabDefinition) => {
  const query = useSelector((state: RootState) => state.query);
  const sort = useSelector(selectSort);
  const queryStatusMap = useSelector(selectQueryStatusMap);
  const error = useMemo(() => {
    if (registryTab == null) {
      return null;
    }

    const prepareQuery = registryTab.prepareQuery || defaultPrepareQueryString;
    const cacheKey = prepareQuery(query, sort);

    return queryStatusMap[cacheKey]?.error;
  }, [query, sort, queryStatusMap, registryTab]);

  return error;
};
