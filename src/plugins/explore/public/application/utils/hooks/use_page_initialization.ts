/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCurrentExploreId } from './use_current_explore_id';
import { useSavedExplore } from './use_saved_explore';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import {
  setSavedSearch,
  setChartType,
  setStyleOptions,
  setFieldNames,
  setQueryState,
} from '../state_management/slices';
import { Query } from '../../../../../data/common';

export const useInitPage = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const exploreId = useCurrentExploreId();
  const { savedExplore, error } = useSavedExplore(exploreId);

  const { chrome, data } = services;

  useEffect(() => {
    if (savedExplore && !error) {
      if (savedExplore.id) {
        // Deserialize state from saved object
        const { title } = savedExplore;

        // Update browser title and breadcrumbs
        chrome.docTitle.change(title);
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: title }]);

        // Sync query from saved object to data plugin (explore doesn't use filters)
        const searchSourceFields = savedExplore.kibanaSavedObjectMeta;
        if (searchSourceFields?.searchSourceJSON) {
          const searchSource = JSON.parse(searchSourceFields.searchSourceJSON);
          const query = searchSource.query;
          // Set query in query string manager
          if (query) {
            data.query.queryString.setQuery(query);
            dispatch(setQueryState(query as Query));
          }
        }

        // Update savedSearch to store just the ID (like discover)
        // TODO: remove this once legacy state is not consumed any more
        dispatch(setSavedSearch(savedExplore.id));

        // Set style options
        const visualization = savedExplore.visualization;
        if (visualization) {
          const { chartType, params, fields } = JSON.parse(visualization);
          dispatch(setChartType(chartType));
          dispatch(setStyleOptions(params));
          dispatch(setFieldNames(fields));
        }

        // Add to recently accessed
        chrome.recentlyAccessed.add(
          `/app/explore#/view/${savedExplore.id}`,
          title,
          savedExplore.id,
          { type: 'explore' }
        );
      }
    }
    if (error) {
      // Navigate to management page for invalid IDs
      // TODO: need to confirm the UI behavior for invalid ID, the current logic is copied from useSavedExplore hook
      if (error.includes('Not found')) {
        chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: 'Error' }]);
      }
    }
  }, [chrome, data.query.queryString, dispatch, error, savedExplore]);

  const pageContext = { savedExplore };

  return pageContext;
};
