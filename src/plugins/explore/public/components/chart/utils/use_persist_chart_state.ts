/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { safeSetItem } from '@osd/std';

export type DiscoverChartToggleId = 'histogram' | 'summary';

// Custom hook to manage persisted chart state
export const usePersistedChartState = (defaultState: DiscoverChartToggleId = 'histogram') => {
  const [toggleIdSelected, setToggleIdSelected] = useState<DiscoverChartToggleId>(defaultState);

  useEffectOnce(() => {
    const storedValue = localStorage.getItem('exploreChartState');
    const isValidState = (value: string | null) => value === 'histogram' || value === 'summary';

    if (storedValue !== null) {
      setToggleIdSelected(
        isValidState(storedValue) ? (storedValue as DiscoverChartToggleId) : defaultState
      );

      if (!isValidState(storedValue)) {
        safeSetItem(localStorage, 'exploreChartState', toggleIdSelected);
      }
    }
  });

  const updateToggleId = (newState: DiscoverChartToggleId) => {
    setToggleIdSelected(newState);
    safeSetItem(localStorage, 'exploreChartState', newState);
  };

  return { toggleIdSelected, updateToggleId };
};
