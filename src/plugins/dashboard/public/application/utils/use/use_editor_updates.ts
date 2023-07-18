/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { DashboardAppState, DashboardAppStateContainer, DashboardServices } from '../../../types';
import { DashboardContainer } from '../../embeddable';
import { Dashboard } from '../../../dashboard';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { setBreadcrumbsForExistingDashboard, setBreadcrumbsForNewDashboard } from '../breadcrumbs';

export const useEditorUpdates = ({
  eventEmitter,
  services,
  dashboard,
  savedDashboardInstance,
  dashboardContainer,
  appState,
}: {
  eventEmitter: EventEmitter;
  services: DashboardServices;
  dashboard?: Dashboard;
  dashboardContainer?: DashboardContainer;
  savedDashboardInstance?: SavedObjectDashboard;
  appState?: DashboardAppStateContainer;
}) => {
  const dashboardDom = document.getElementById('dashboardViewport');
  const [currentAppState, setCurrentAppState] = useState<DashboardAppState>();
  const [isEmbeddableRendered, setIsEmbeddableRendered] = useState(false);
  // We only mark dirty when there is changes in the panels, query, and filters
  // We do not mark dirty for embed mode, view mode, full screen and etc
  // The specific behaviors need to check the functional tests and previous dashboard
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!appState || !savedDashboardInstance || !dashboard) {
      return;
    }

    const initialState = appState.getState();
    setCurrentAppState(initialState);

    const unsubscribeStateUpdates = appState.subscribe((state) => {
      setCurrentAppState(state);
    });

    return () => {
      unsubscribeStateUpdates();
    };
  }, [appState, eventEmitter, dashboard, savedDashboardInstance]);

  useEffect(() => {
    const { chrome } = services;
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
  }, [savedDashboardInstance, services, currentAppState, dashboard]);

  useEffect(() => {
    if (!dashboardContainer || !dashboardDom) {
      return;
    }
    dashboardContainer.render(dashboardDom);
    setIsEmbeddableRendered(true);

    return () => {
      setIsEmbeddableRendered(false);
    };
  }, [dashboardContainer, dashboardDom]);

  useEffect(() => {
    // clean up all registered listeners, if any are left
    return () => {
      eventEmitter.removeAllListeners();
    };
  }, [eventEmitter]);

  return { currentAppState, isEmbeddableRendered };
};
