/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { HeaderVariant } from 'opensearch-dashboards/public';
import { ExploreServices } from '../../../types';

/**
 * Hook to handle URL state synchronization for global state (_g)
 * Syncs time, filters, and refresh settings with URL
 */
export const useHeaderVariants = (services: ExploreServices, variant: HeaderVariant) => {
  const { setHeaderVariant } = services.chrome;

  useEffect(() => {
    setHeaderVariant?.(variant);
    return () => {
      setHeaderVariant?.();
    };
  }, [setHeaderVariant, variant]);
};
