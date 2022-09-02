/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { useEffect, useState } from 'react';
import { SavedObject } from '../../../../../saved_objects/public';
import {
  redirectWhenMissing,
  SavedObjectNotFound,
} from '../../../../../opensearch_dashboards_utils/public';
import { EDIT_PATH, PLUGIN_ID } from '../../../../common';
import { WizardServices } from '../../../types';
import { MetricOptionsDefaults } from '../../../visualizations/metric/metric_viz_type';
import { getCreateBreadcrumbs, getEditBreadcrumbs } from '../breadcrumbs';
import { getSavedWizardVis } from '../get_saved_wizard_vis';
import {
  useTypedDispatch,
  setStyleState,
  setVisualizationState,
  VisualizationState,
} from '../state_management';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { setEditorState } from '../state_management/metadata_slice';

// This function can be used when instantiating a saved vis or creating a new one
// using url parameters, embedding and destroying it in DOM
export const useSavedWizardVis = (visualizationIdFromUrl: string | undefined) => {
  const { services } = useOpenSearchDashboards<WizardServices>();
  const [savedVisState, setSavedVisState] = useState<SavedObject | undefined>(undefined);
  const dispatch = useTypedDispatch();

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      history,
      http: { basePath },
      toastNotifications,
    } = services;
    const loadSavedWizardVis = async () => {
      try {
        const savedWizardVis = await getSavedWizardVis(services, visualizationIdFromUrl);

        if (savedWizardVis.id) {
          chrome.setBreadcrumbs(getEditBreadcrumbs(savedWizardVis.title, navigateToApp));
          chrome.docTitle.change(savedWizardVis.title);
        } else {
          chrome.setBreadcrumbs(getCreateBreadcrumbs(navigateToApp));
        }

        if (savedWizardVis.styleState !== '{}' && savedWizardVis.visualizationState !== '{}') {
          const styleState = JSON.parse(savedWizardVis.styleState);
          const vizStateWithoutIndex = JSON.parse(savedWizardVis.visualizationState);
          const visualizationState: VisualizationState = {
            searchField: vizStateWithoutIndex.searchField,
            activeVisualization: vizStateWithoutIndex.activeVisualization,
            indexPattern: savedWizardVis.searchSourceFields.index,
          };
          // TODO: Add validation and transformation, throw/handle errors
          dispatch(setStyleState<MetricOptionsDefaults>(styleState));
          dispatch(setVisualizationState(visualizationState));
        }

        setSavedVisState(savedWizardVis);
        dispatch(setEditorState({ state: 'clean' }));
      } catch (error) {
        const managementRedirectTarget = {
          [PLUGIN_ID]: {
            app: 'management',
            path: `opensearch-dashboards/objects/savedWizard/${visualizationIdFromUrl}`,
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
        } catch (e) {
          const message = e instanceof Error ? e.message : '';
          toastNotifications.addWarning({
            title: i18n.translate('visualize.createVisualization.failedToLoadErrorMessage', {
              defaultMessage: 'Failed to load the visualization',
            }),
            text: message,
          });
          history.replace(EDIT_PATH);
        }
      }
    };

    loadSavedWizardVis();
  }, [dispatch, services, visualizationIdFromUrl]);

  return savedVisState;
};
