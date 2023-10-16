/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useEffect, useState } from 'react';
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
  setEditorState,
} from '../state_management';
import { setStatus } from '../state_management/editor_slice';
import { getStateFromSavedObject } from '../../../saved_visualizations/transforms';

// This function can be used when instantiating a saved vis or creating a new one
// using url parameters, embedding and destroying it in DOM
export const useSavedVisBuilderVis = (
  services: VisBuilderServices,
  visualizationIdFromUrl: string | undefined
) => {
  const [savedVisState, setSavedVisState] = useState<SavedObject | undefined>(undefined);
  const dispatch = useTypedDispatch();
  const {
    application: { navigateToApp },
    chrome,
    http: { basePath },
    toastNotifications,
    savedVisBuilderLoader,
    history,
  } = services;

  useEffect(() => {
    const toastNotification = (message: string) => {
      toastNotifications.addDanger({
        title: i18n.translate('visualize.createVisualization.failedToLoadErrorMessage', {
          defaultMessage: 'Failed to load the visualization',
        }),
        text: message,
      });
    };

    const loadSavedVisBuilderVis = async () => {
      try {
        dispatch(setStatus({ status: 'loading' }));
        const savedVisBuilderVis = await getSavedVisBuilderVis(
          savedVisBuilderLoader,
          visualizationIdFromUrl
        );

        if (savedVisBuilderVis.id) {
          const { title, state } = getStateFromSavedObject(savedVisBuilderVis);
          chrome.setBreadcrumbs(getEditBreadcrumbs(title, navigateToApp));
          chrome.docTitle.change(title);

          dispatch(setUIStateState(state.ui));
          dispatch(setStyleState(state.style));
          dispatch(setVisualizationState(state.visualization));
          dispatch(setStatus({ status: 'loaded' }));
        } else {
          chrome.setBreadcrumbs(getCreateBreadcrumbs(navigateToApp));
        }

        setSavedVisState(savedVisBuilderVis);
        dispatch(
          setEditorState({ errors: {}, status: 'clean', savedVisBuilderId: savedVisBuilderVis.id })
        );
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
  }, [
    dispatch,
    basePath,
    chrome,
    history,
    navigateToApp,
    savedVisBuilderLoader,
    toastNotifications,
    visualizationIdFromUrl,
  ]);

  return savedVisState;
};

export async function getSavedVisBuilderVis(
  savedVisBuilderLoader: VisBuilderServices['savedVisBuilderLoader'],
  visBuilderVisId?: string
) {
  const savedVisBuilderVis = await savedVisBuilderLoader.get(visBuilderVisId);

  return savedVisBuilderVis;
}
