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

  const { appStateContainer, currentContainer, indexPatterns } = useDashboardAppAndGlobalState(
    services,
    eventEmitter,
    savedDashboardInstance,
    dashboard
  );

  const { isEmbeddableRendered, currentAppState } = useEditorUpdates(
    eventEmitter,
    dashboard,
    savedDashboardInstance,
    currentContainer,
    appStateContainer
  );

  useEffect(() => {
    if (appStateContainer && dashboard) {
      if (savedDashboardInstance?.id) {
        chrome.setBreadcrumbs(
          setBreadcrumbsForExistingDashboard(
            savedDashboardInstance.title,
            appStateContainer?.getState().viewMode,
            dashboard.isDirty
          )
        );
        chrome.docTitle.change(savedDashboardInstance.title);
      } else {
        chrome.setBreadcrumbs(
          setBreadcrumbsForNewDashboard(appStateContainer?.getState().viewMode, dashboard.isDirty)
        );
      }
    }
  }, [savedDashboardInstance, chrome, appStateContainer, dashboard]);

  useEffect(() => {
    // clean up all registered listeners if any is left
    return () => {
      eventEmitter.removeAllListeners();
    };
  }, [eventEmitter]);

  return (
    <div>
      <div>
        {savedDashboardInstance && currentAppState && currentContainer && dashboard && (
          <DashboardTopNav
            isChromeVisible={isChromeVisible}
            savedDashboardInstance={savedDashboardInstance}
            appState={appStateContainer!}
            dashboard={dashboard}
            currentAppState={currentAppState}
            isEmbeddableRendered={isEmbeddableRendered}
            indexPatterns={indexPatterns}
            currentContainer={currentContainer}
            dashboardIdFromUrl={dashboardIdFromUrl}
          />
        )}
      </div>
    </div>
  );
};
