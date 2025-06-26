/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { SavedExplore } from '../../../types/saved_explore_types';
import { setState } from '../state_management/slices/legacy_slice';
import { setQuery } from '../state_management/slices/query_slice';
import { Query } from '../../../../../data/common';
import { setUiState } from '../state_management/slices/ui_slice';
/**
 * Hook for loading saved explore objects (following vis_builder pattern)
 * This handles saved object loading AFTER store creation, not during getPreloadedState
 */
export const useSavedExplore = (exploreIdFromUrl?: string) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [savedExploreState, setSavedExploreState] = useState<SavedExplore | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const { chrome, data, toastNotifications, getSavedExploreById } = services;

  const loadSavedExplore = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load saved explore object
      const savedExploreObject = await getSavedExploreById(exploreIdFromUrl);

      if (savedExploreObject?.id) {
        // Deserialize state from saved object
        const { title } = savedExploreObject;

        // Update browser title and breadcrumbs
        chrome.docTitle.change(title);
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: title }]);

        // Sync query from saved object to data plugin (explore doesn't use filters)
        const searchSourceFields = savedExploreObject.kibanaSavedObjectMeta;
        if (searchSourceFields?.searchSourceJSON) {
          const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);
          const query = searchSource.query;
          // Set query in query string manager
          if (query) {
            data.query.queryString.setQuery(query);
            dispatch(setQuery(query as Query));
          }
        }

        // Update savedSearch to store just the ID (like discover)
        // TODO: remove this once legacy state is not consumed any more
        const legacyStateWithId = {
          savedSearch: exploreIdFromUrl, // Store the ID, not the object
        };
        dispatch(setState(legacyStateWithId));

        // Set style options
        const visualization = savedExploreObject.visualization;
        if (visualization) {
          const { chartType, styleOptions } = JSON.parse(visualization);
          dispatch(setUiState({ chartType, styleOptions }));
        }

        // Add to recently accessed
        chrome.recentlyAccessed.add(
          `/app/explore#/view/${savedExploreObject.id}`,
          title,
          savedExploreObject.id,
          { type: 'explore' }
        );
      }
      setSavedExploreState(savedExploreObject);
    } catch (loadError) {
      const errorMessage = `Failed to load saved explore: ${(loadError as Error).message}`;
      setError(errorMessage);

      toastNotifications.addError(loadError as Error, {
        title: 'Error loading saved explore',
        toastMessage: errorMessage,
      });

      // Navigate to management page for invalid IDs
      if ((loadError as Error).message.includes('Not found')) {
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: 'Error' }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [exploreIdFromUrl, getSavedExploreById, dispatch, chrome, data, toastNotifications]);

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
