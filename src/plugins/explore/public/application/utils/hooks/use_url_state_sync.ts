/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncQueryStateWithUrl } from '../../../../../data/public';
import { ExploreServices } from '../../../types';

/**
 * Hook to handle URL state synchronization for global state (_g)
 * Syncs time, filters, and refresh settings with URL
 */
export const useUrlStateSync = (services: ExploreServices) => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!services?.osdUrlStateStorage) return;

    // Create URL state storage
    const osdUrlStateStorage = services.osdUrlStateStorage;

    // syncs `_g` portion of url with query services (time, filters, refresh)
    const { stop } = syncQueryStateWithUrl(
      services.data.query,
      osdUrlStateStorage,
      services.uiSettings
    );

    return stop;
  }, [services, pathname]); // pathname ensures state preserved on navigation
};
