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
  const isChromeVisible = useChromeVisibility(chrome);
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
    if (currentAppState && dashboard) {
      if (savedDashboardInstance?.id) {
        chrome.setBreadcrumbs(
          setBreadcrumbsForExistingDashboard(
            savedDashboardInstance.title,
            currentAppState.viewMode,
            dashboard.isDirty
          )
        );
        chrome.docTitle.change(savedDashboardInstance.title);
      } else {
        chrome.setBreadcrumbs(
          setBreadcrumbsForNewDashboard(currentAppState.viewMode, dashboard.isDirty)
        );
      }
    }
  }, [currentAppState, savedDashboardInstance, chrome, dashboard]);

  useEffect(() => {
    // clean up all registered listeners if any is left
    return () => {
      eventEmitter.removeAllListeners();
    };
  }, [eventEmitter]);

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
