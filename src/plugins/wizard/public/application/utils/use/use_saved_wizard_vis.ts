/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { i18n } from '@osd/i18n';
import { useEffect, useState } from 'react';
import { SavedObject } from '../../../../../saved_objects/public';
// import { redirectWhenMissing } from '../../../../../opensearch_dashboards_utils/public';
// import { EDIT_PATH } from '../../../../common';
import { WizardServices } from '../../../types';
import { MetricOptionsDefaults } from '../../../visualizations/metric/metric_viz_type';
import { getSavedWizardVis } from '../get_saved_wizard_vis';
import { useTypedDispatch, setStyleState, setVisualizationState } from '../state_management';

export const useSavedWizardVisInstance = (
  services: WizardServices,
  visualizationIdFromUrl: string | undefined
) => {
  const [state, setState] = useState<{
    savedWizardVis?: SavedObject;
  }>({});
  const dispatch = useTypedDispatch();

  useEffect(() => {
    const {
      // application: { navigateToApp },
      chrome,
      // history,
      // http: { basePath },
      // setActiveUrl,
      // toastNotifications,
    } = services;
    // TODO: remove "instance" from naming
    const getSavedWizardVisInstance = async () => {
      try {
        const savedWizardVis = await getSavedWizardVis(services, visualizationIdFromUrl);

        if (savedWizardVis.id) {
          // TODO: update breadcrumbs
          // chrome.setBreadcrumbs(getEditBreadcrumbs(savedWizardVis.title));
          chrome.docTitle.change(savedWizardVis.title);
        } else {
          // chrome.setBreadcrumbs(getCreateBreadcrumbs());
        }

        dispatch(setStyleState<MetricOptionsDefaults>(JSON.parse(savedWizardVis.state).style));
        dispatch(setVisualizationState(JSON.parse(savedWizardVis.state).visualization));
        setState({ savedWizardVis });
      } catch (error) {
        // TODO: implement error handling
        // const managementRedirectTarget = {
        //   app: 'management',
        //   path: `opensearch-dashboards/objects/savedVisualizations/${visualizationIdFromUrl}`,
        // };
        //
        // try {
        //   redirectWhenMissing({
        //     history,
        //     navigateToApp,
        //     toastNotifications,
        //     basePath,
        //     mapping: managementRedirectTarget,
        //     onBeforeRedirect() {
        //       setActiveUrl(EDIT_PATH);
        //     },
        //   })(error);
        // } catch (e) {
        //   toastNotifications.addWarning({
        //     title: i18n.translate('visualize.createVisualization.failedToLoadErrorMessage', {
        //       defaultMessage: 'Failed to load the visualization',
        //     }),
        //     text: e.message,
        //   });
        //   history.replace(EDIT_PATH);
        // }
      }
    };

    getSavedWizardVisInstance();
  }, [dispatch, services, visualizationIdFromUrl]);

  return state;
};
