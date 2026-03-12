/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import rison from 'rison-node';
import { useCurrentExploreId } from './use_current_explore_id';
import { useSavedExplore } from './use_saved_explore';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import {
  setSavedSearch,
  setQueryState,
  setActiveTab,
  clearResults,
  clearQueryStatusMap,
  clearLastExecutedData,
  setEditorMode,
  setUsingRegexPatterns,
} from '../state_management/slices';
import { executeQueries } from '../state_management/actions/query_actions';
import { ExploreFlavor } from '../../../../common';
import { useSetEditorText } from '../../hooks';
import { EditorMode } from '../state_management/types';
import { getVisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { useFlavorId } from '../../../helpers/use_flavor_id';

export const useInitPage = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const exploreId = useCurrentExploreId();
  const { savedExplore, error } = useSavedExplore(exploreId);
  const setEditorText = useSetEditorText();
  const { chrome, data, application, http } = services;
  const visualizationBuilder = getVisualizationBuilder();
  const currentFlavor = useFlavorId();

  useEffect(() => {
    if (savedExplore && !error && savedExplore.id) {
      // Check if saved explore's flavor matches current page flavor
      const savedFlavor = savedExplore.type ?? ExploreFlavor.Logs;

      // If flavors don't match, redirect to BASE page of CURRENT flavor instead of loading incompatible viz
      // This prevents traces saved viz from loading on logs page
      if (currentFlavor && currentFlavor !== savedFlavor) {
        // Clear the incompatible query from URL state before redirecting
        if (services.osdUrlStateStorage) {
          services.osdUrlStateStorage.set('_q', null);
          services.osdUrlStateStorage.set('_a', null);
          services.osdUrlStateStorage.set('_v', null);

          // Also clear query from _g (global state)
          const globalState = services.osdUrlStateStorage.get('_g') as any;
          if (globalState) {
            delete globalState.query;
            services.osdUrlStateStorage.set('_g', globalState);
          }

          services.osdUrlStateStorage.flush();
        }

        // Extract _g parameter from hash (format: #/?_q=...&_g=...&_a=...)
        const currentHash = window.location.hash;
        const hashParams = currentHash.includes('?') ? currentHash.split('?')[1] : '';
        const params = new URLSearchParams(hashParams);
        let gParam = params.get('_g');

        // Parse and clean _g parameter to remove query
        if (gParam) {
          try {
            const decoded = rison.decode(decodeURIComponent(gParam)) as Record<string, unknown>;
            delete decoded.query;
            gParam = encodeURIComponent(rison.encode(decoded));
          } catch (e) {
            // Failed to clean _g parameter, use as-is
          }
        }

        // Build clean URL with only time/filters, no query/app state
        const basePath = http?.basePath?.get() ?? '';
        const flavorPath = `/app/explore/${currentFlavor}`;
        const newHash = gParam ? `#/?_g=${gParam}` : '#/';

        // Use application service for SPA navigation instead of full page reload
        application?.navigateToUrl(`${basePath}${flavorPath}${newHash}`);
        return;
      }

      // Deserialize state from saved object
      const { title } = savedExplore;

      // Update browser title and breadcrumbs
      chrome.docTitle.change(title);
      chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: title }]);

      // Sync query from saved object to data plugin (explore doesn't use filters)
      const searchSourceFields = savedExplore.kibanaSavedObjectMeta;
      const queryFromUrl = services.osdUrlStateStorage?.get('_q') ?? {};
      if (searchSourceFields?.searchSourceJSON) {
        const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);
        const queryFromSavedSearch = searchSource.query;
        const query = {
          ...queryFromSavedSearch,
          ...queryFromUrl,
          query: queryFromUrl.query || queryFromSavedSearch.query,
        };
        if (query) {
          dispatch(setQueryState(query));
          setEditorText(query.query);
        }
      }

      // Update savedSearch to store just the ID (like discover)
      // TODO: remove this once legacy state is not consumed any more
      dispatch(setSavedSearch(savedExplore.id));

      // Init vis state and ui state
      const visualization = savedExplore.visualization;
      const uiState = savedExplore.uiState;
      if (visualization) {
        const { chartType, params, axesMapping } = JSON.parse(visualization);
        visualizationBuilder.setVisConfig({ type: chartType, styles: params, axesMapping });
      }
      if (uiState) {
        const { activeTab } = JSON.parse(uiState);
        dispatch(setActiveTab(activeTab));
      }

      // Add to recently accessed
      chrome.recentlyAccessed.add(
        `/app/explore/${savedExplore.type ?? ExploreFlavor.Logs}#/view/${savedExplore.id}`,
        title,
        savedExplore.id,
        { type: 'explore' }
      );

      dispatch(clearLastExecutedData());
      dispatch(setEditorMode(EditorMode.Query));
      dispatch(clearResults());
      dispatch(clearQueryStatusMap());
      dispatch(setUsingRegexPatterns(false));
      dispatch(executeQueries({ services }));
    }
    if (error) {
      // Navigate to management page for invalid IDs
      // TODO: need to confirm the UI behavior for invalid ID, the current logic is copied from useSavedExplore hook
      if (error.includes('Not found')) {
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: 'Error' }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chrome,
    data.query.queryString,
    dispatch,
    error,
    savedExplore,
    services, // http is accessed via services.http
    setEditorText,
    visualizationBuilder,
    currentFlavor,
    application,
  ]);

  const pageContext = { savedExplore };

  return pageContext;
};
