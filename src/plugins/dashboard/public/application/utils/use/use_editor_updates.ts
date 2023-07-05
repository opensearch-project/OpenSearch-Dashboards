/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { DashboardAppState, DashboardAppStateContainer } from '../../../types';
import { DashboardContainer } from '../../embeddable';
import { Dashboard } from '../../../dashboard';

export const useEditorUpdates = (
  eventEmitter: EventEmitter,
  dashboard?: Dashboard,
  dashboardInstance?: any,
  dashboardContainer?: DashboardContainer,
  appState?: DashboardAppStateContainer
) => {
  const [isEmbeddableRendered, setIsEmbeddableRendered] = useState(false);
  const [currentAppState, setCurrentAppState] = useState<DashboardAppState>();
  // We only mark dirty when there is changes in the panels, query, and filters
  // We do not mark dirty for embed mode, view mode, full screen and etc
  // The specific behaviors need to check the functional tests and previous dashboard
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    if (!appState || !dashboardContainer || !dashboardInstance || !dashboard) {
      return;
    }

    const initialState = appState.getState();
    setCurrentAppState(initialState);
    setIsEmbeddableRendered(true);

    const reloadDashboardContainer = () => {
      const dashboardDom = document.getElementById('dashboardViewport');
      if (!dashboardDom) {
        return;
      }
      dashboardContainer.render(dashboardDom);
    };

    const unsubscribeStateUpdates = appState.subscribe((state) => {
      setCurrentAppState(state);
      reloadDashboardContainer();
    });

    reloadDashboardContainer();
    return () => {
      setIsEmbeddableRendered(false);
      unsubscribeStateUpdates();
    };
  }, [dashboardContainer, appState, dashboardInstance, dashboard, eventEmitter]);

  return { isEmbeddableRendered, currentAppState };
};
