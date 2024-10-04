/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SavedObject } from '../../../../../saved_objects/public';
import {
  InvalidJSONProperty,
  redirectWhenMissing,
  SavedObjectNotFound,
} from '../../../../../opensearch_dashboards_utils/public';
import { EDIT_PATH, PLUGIN_ID } from '../../../../common';
import { VisBuilderServices } from '../../../types';
import { getCreateBreadcrumbs, getEditBreadcrumbs } from '../breadcrumbs';
import {
  useTypedDispatch,
  setStyleState,
  setVisualizationState,
  setUIStateState,
} from '../state_management';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { setEditorState } from '../state_management/metadata_slice';
import { getStateFromSavedObject } from '../../../saved_visualizations/transforms';

// This function can be used when instantiating a saved vis or creating a new one
// using url parameters, embedding and destroying it in DOM
export const useSavedVisBuilderVis = (visualizationIdFromUrl: string | undefined) => {
  const { services } = useOpenSearchDashboards<VisBuilderServices>();
  const [savedVisState, setSavedVisState] = useState<SavedObject | undefined>(undefined);
  const dispatch = useTypedDispatch();
  const isMigrated = useSelector((state: any) => state.metadata?.isMigrated);

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      data,
      history,
      http: { basePath },
      toastNotifications,
      savedVisBuilderLoader,
    } = services;
    const toastNotification = (message: string) => {
      toastNotifications.addDanger({
        title: i18n.translate('visBuilder.createVisualization.failedToLoadErrorMessage', {
          defaultMessage: 'Failed to load the visualization',
        }),
        text: message,
      });
    };

    const loadSavedVisBuilderVis = async () => {
      try {
        dispatch(setEditorState({ state: 'loading' }));
        const savedVisBuilderVis = await getSavedVisBuilderVis(
          savedVisBuilderLoader,
          visualizationIdFromUrl
        );

        if (savedVisBuilderVis.id) {
          const { title, state } = getStateFromSavedObject(savedVisBuilderVis);

          // Use isMigrated to determine which breadcrumb function to use
          const breadcrumbs = isMigrated
            ? getCreateBreadcrumbs(navigateToApp, isMigrated)
            : getEditBreadcrumbs(title, navigateToApp);

          chrome.setBreadcrumbs(breadcrumbs);

          // Change the title based on isMigrated
          const newTitle = isMigrated ? 'New Visualization' : title;
          chrome.docTitle.change(newTitle);
          // sync initial app filters from savedObject to filterManager
          const filters = savedVisBuilderVis.searchSourceFields.filter;
          const query =
            savedVisBuilderVis.searchSourceFields.query || data.query.queryString.getDefaultQuery();
          const actualFilters = [];
          const tempFilters = typeof filters === 'function' ? filters() : filters;
          (Array.isArray(tempFilters) ? tempFilters : [tempFilters]).forEach((filter) => {
            if (filter) actualFilters.push(filter);
          });
          data.query.filterManager.setAppFilters(actualFilters);
          data.query.queryString.setQuery(query);

          chrome.recentlyAccessed.add(
            savedVisBuilderVis.getFullPath(),
            title,
            savedVisBuilderVis.id,
            { type: savedVisBuilderVis.getOpenSearchType() }
          );

          dispatch(setUIStateState(state.ui));
          dispatch(setStyleState(state.style));
          dispatch(setVisualizationState(state.visualization));
          dispatch(setEditorState({ state: 'loaded' }));
        } else {
          chrome.setBreadcrumbs(getCreateBreadcrumbs(navigateToApp, isMigrated));
        }

        setSavedVisState(savedVisBuilderVis);
        dispatch(setEditorState({ state: 'clean' }));
      } catch (error) {
        const managementRedirectTarget = {
          [PLUGIN_ID]: {
            app: 'management',
            path: `opensearch-dashboards/objects/savedVisBuilder/${visualizationIdFromUrl}`,
          },
        };

        try {
          if (error instanceof SavedObjectNotFound) {
            redirectWhenMissing({
              history,
              navigateToApp,
              toastNotifications,
              basePath,
              mapping: managementRedirectTarget,
            })(error);
          }
          if (error instanceof InvalidJSONProperty) {
            toastNotification(error.message);
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : '';
          toastNotification(message);
          history.replace(EDIT_PATH);
        }
      }
    };

    loadSavedVisBuilderVis();
  }, [dispatch, services, visualizationIdFromUrl, isMigrated]);

  return savedVisState;
};

async function getSavedVisBuilderVis(
  savedVisBuilderLoader: VisBuilderServices['savedVisBuilderLoader'],
  visBuilderVisId?: string
) {
  const savedVisBuilderVis = await savedVisBuilderLoader.get(visBuilderVisId);

  return savedVisBuilderVis;
}
