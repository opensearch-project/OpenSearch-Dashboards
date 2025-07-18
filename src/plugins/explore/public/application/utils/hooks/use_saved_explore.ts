/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../types/saved_explore_types';
/**
 * Hook for loading saved explore objects
 */
export const useSavedExplore = (exploreIdFromUrl?: string) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [savedExploreState, setSavedExploreState] = useState<SavedExplore | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toastNotifications, getSavedExploreById } = services;

  const loadSavedExplore = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load saved explore object
      const savedExploreObject = await getSavedExploreById(exploreIdFromUrl);
      setSavedExploreState(savedExploreObject);
    } catch (loadError) {
      const errorMessage = `Failed to load saved explore: ${(loadError as Error).message}`;
      setError(errorMessage);

      toastNotifications.addError(loadError as Error, {
        title: 'Error loading saved explore',
        toastMessage: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [exploreIdFromUrl, getSavedExploreById, toastNotifications]);

  useEffect(() => {
    loadSavedExplore();
  }, [loadSavedExplore]);

  return {
    savedExplore: savedExploreState,
    isLoading,
    error,
    reload: loadSavedExplore,
  };
};
