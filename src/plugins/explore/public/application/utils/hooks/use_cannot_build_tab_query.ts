/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { selectPatternsField } from '../state_management/selectors';

/**
 * True when a tab's `prepareQuery` returns an empty string, meaning it cannot yet
 * build a query. Such a tab has no cache key, so it records no status to key off.
 */
export const useCannotBuildTabQuery = (registryTab?: TabDefinition) => {
  const query = useSelector((state: RootState) => state.query);
  // Re-runs the memo once the user picks a field.
  const patternsField = useSelector(selectPatternsField);

  return useMemo(() => {
    if (!registryTab?.prepareQuery) {
      return false;
    }
    return !registryTab.prepareQuery(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryTab, query, patternsField]);
};
