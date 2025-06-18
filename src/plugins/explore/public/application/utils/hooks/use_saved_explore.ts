/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { getStateFromSavedObject } from '../../../saved_explore/transforms';
import { SavedExplore, SavedExploreAttributes } from '../../../types/saved_explore_types';
import { setState } from '../state_management/slices/legacy_slice';
import { setQuery } from '../state_management/slices/query_slice';
import { Query } from '../../../../../data/common';
import { ISearchSource } from '../../../../../data/public';
import { SavedObjectLoader } from '../../../../../saved_objects/public';
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

  const { chrome, data, toastNotifications, savedObjects } = services;

  const loadSavedExplore = useCallback(async () => {
    if (!exploreIdFromUrl) {
      setSavedExploreState(undefined);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load saved explore object
      const savedExploreObject = await savedObjects.client.get<SavedExploreAttributes>(
        'explore',
        exploreIdFromUrl
      );

      if (savedExploreObject.id) {
        // Deserialize state from saved object
        const { title, description, state } = getStateFromSavedObject(
          savedExploreObject.attributes
        );

        // Update browser title and breadcrumbs
        chrome.docTitle.change(title);
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: title }]);

        // Sync query from saved object to data plugin (explore doesn't use filters)
        const searchSourceFields = savedExploreObject.attributes.kibanaSavedObjectMeta;
        if (searchSourceFields?.searchSourceJSON) {
          const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);

          // Set query in query string manager
          if (searchSource.query) {
            data.query.queryString.setQuery(searchSource.query);
          }
        }

        // Update Redux state with loaded state
        if (state.legacy) {
          // Update savedSearch to store just the ID (like discover)
          const legacyStateWithId = {
            ...state.legacy,
            savedSearch: exploreIdFromUrl, // Store the ID, not the object
          };
          dispatch(setState(legacyStateWithId));
        }
        if (state.query) {
          dispatch(setQuery(state.query as Query));
        }
        // Note: UI state would be handled by UI slice when implemented
        // For now, we skip UI state updates

        // Add to recently accessed
        chrome.recentlyAccessed.add(
          `/app/explore#/view/${exploreIdFromUrl}`,
          title,
          exploreIdFromUrl,
          { type: 'explore' }
        );

        // Create SavedExplore object for compatibility
        const savedExplore: SavedExplore = {
          id: savedExploreObject.id,
          title,
          description,
          searchSource: {} as ISearchSource, // Will be populated from searchSourceFields
          legacyState: savedExploreObject.attributes.legacyState,
          uiState: savedExploreObject.attributes.uiState,
          queryState: savedExploreObject.attributes.queryState,
          version: savedExploreObject.attributes.version,
          // Add other SavedObject methods
          copyOnSave: false,
          destroy: () => {},
          lastSavedTitle: title,
          save: async () => exploreIdFromUrl,
          getFullPath: () => `/app/explore#/view/${exploreIdFromUrl}`,
          getOpenSearchType: () => 'explore',
        };

        setSavedExploreState(savedExplore);
      }
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
  }, [exploreIdFromUrl, chrome, data, dispatch, savedObjects, toastNotifications]);

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

/**
 * Helper function to get saved explore by ID (similar to vis_builder)
 */
export const getSavedExploreById = async (
  savedObjectsClient: SavedObjectsClientContract,
  savedObjectService: SavedObjectLoader,
  exploreId?: string
): Promise<SavedExplore | undefined> => {
  if (!exploreId) return undefined;

  try {
    const savedObject = await savedObjectsClient.get<SavedExploreAttributes>('explore', exploreId);
    const { searchSource }: SavedExplore = await savedObjectService.get(exploreId);
    const { title, description } = getStateFromSavedObject(savedObject.attributes);

    return {
      id: savedObject.id,
      title,
      description,
      searchSource,
      legacyState: savedObject.attributes.legacyState,
      uiState: savedObject.attributes.uiState,
      queryState: savedObject.attributes.queryState,
      version: savedObject.attributes.version,
      copyOnSave: false,
      destroy: () => {},
      lastSavedTitle: title,
      save: async () => exploreId,
      getFullPath: () => `/app/explore#/view/${exploreId}`,
      getOpenSearchType: () => 'explore',
    };
  } catch (error) {
    // Error loading saved explore - silently ignore
    return undefined;
  }
};
