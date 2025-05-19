/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncQueryStateWithUrl } from '../../../../../data/public';
import {
  createOsdUrlStateStorage,
  withNotifyOnErrors,
} from '../../../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../../../types';

/**
 * Hook to handle URL state synchronization for global state (_g)
 * Syncs time, filters, and refresh settings with URL
 */
export const useUrlStateSync = (services: ExploreServices) => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!services?.data) return;

    console.log('🌐 URL State Sync: Setting up _g state sync for pathname:', pathname);

    // Create URL state storage
    const osdUrlStateStorage = createOsdUrlStateStorage({
      history: services.history(),
      useHash: services.uiSettings.get('state:storeInSessionStorage', false),
      ...withNotifyOnErrors(services.toastNotifications),
    });

    console.log('🌐 URL State Sync: Created URL state storage');

    // syncs `_g` portion of url with query services (time, filters, refresh)
    const { stop } = syncQueryStateWithUrl(
      services.data.query,
      osdUrlStateStorage,
      services.uiSettings
    );

    console.log('🌐 URL State Sync: syncQueryStateWithUrl started');

    return stop;
  }, [services, pathname]); // pathname ensures state preserved on navigation
};
