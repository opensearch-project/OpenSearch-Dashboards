/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EventEmitter } from 'events';
import { DashboardTopNav } from '../components/dashboard_top_nav';
import { useChromeVisibility } from '../utils/use/use_chrome_visibility';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useSavedDashboardInstance } from '../utils/use/use_saved_dashboard_instance';
import { DashboardServices } from '../../types';
import { useDashboardAppAndGlobalState } from '../utils/use/use_dashboard_app_state';
import { useDashboardContainer } from '../utils/use/use_dashboard_container';
import { useEditorUpdates } from '../utils/use/use_editor_updates';
import {
  setBreadcrumbsForExistingDashboard,
  setBreadcrumbsForNewDashboard,
} from '../utils/breadcrumbs';

export const DashboardEditor = () => {
  const { id: dashboardIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { chrome } = services;
  const isChromeVisible = useChromeVisibility(services.chrome);
  const [eventEmitter] = useState(new EventEmitter());

  const { savedDashboard: savedDashboardInstance, dashboard } = useSavedDashboardInstance(
    services,
    eventEmitter,
    isChromeVisible,
    dashboardIdFromUrl
  );

  const { appState } = useDashboardAppAndGlobalState(
    services,
    eventEmitter,
    savedDashboardInstance
  );

  const { dashboardContainer, indexPatterns } = useDashboardContainer(
    services,
    isChromeVisible,
    eventEmitter,
    dashboard,
    savedDashboardInstance,
    appState
  );

  const { isEmbeddableRendered, currentAppState } = useEditorUpdates(
    services,
    eventEmitter,
    dashboard,
    savedDashboardInstance,
    dashboardContainer,
    appState
  );

  useEffect(() => {
    if (appState && dashboard) {
      if (savedDashboardInstance?.id) {
        chrome.setBreadcrumbs(
          setBreadcrumbsForExistingDashboard(
            savedDashboardInstance.title,
            appState?.getState().viewMode,
            dashboard.isDirty
          )
        );
        chrome.docTitle.change(savedDashboardInstance.title);
      } else {
        chrome.setBreadcrumbs(
          setBreadcrumbsForNewDashboard(appState?.getState().viewMode, dashboard.isDirty)
        );
      }
    }
  }, [appState?.getState(), savedDashboardInstance, chrome]);

  useEffect(() => {
    // clean up all registered listeners if any is left
    return () => {
      eventEmitter.removeAllListeners();
    };
  }, [eventEmitter]);

  console.log('savedDashboardInstance', savedDashboardInstance);
  console.log('dashboard', dashboard);
  console.log('appState', appState);
  console.log('appStateData', appState?.getState());
  console.log('currentAppState', currentAppState);
  console.log('isEmbeddableRendered', isEmbeddableRendered);
  if (dashboard) {
    console.log('isDirty', dashboard.isDirty);
  }
  console.log('dashboardContainer', dashboardContainer);
  console.log('indexPatterns', indexPatterns);

  return (
    <div>
      <div>
        {savedDashboardInstance &&
          appState &&
          dashboardContainer &&
          currentAppState &&
          dashboard && (
            <DashboardTopNav
              isChromeVisible={isChromeVisible}
              savedDashboardInstance={savedDashboardInstance}
              stateContainer={appState}
              dashboard={dashboard}
              currentAppState={currentAppState}
              isEmbeddableRendered={isEmbeddableRendered}
              indexPatterns={indexPatterns}
              dashboardContainer={dashboardContainer}
              dashboardIdFromUrl={dashboardIdFromUrl}
            />
          )}
      </div>
    </div>
  );
};
