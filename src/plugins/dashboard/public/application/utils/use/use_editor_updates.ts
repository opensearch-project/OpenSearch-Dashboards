/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { merge } from 'rxjs';
import { DashboardAppState, DashboardAppStateContainer, DashboardServices } from '../../../types';
import { DashboardContainer } from '../../embeddable';
import { Dashboard } from '../../../dashboard';

export const useEditorUpdates = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  dashboard?: Dashboard,
  dashboardInstance?: any,
  dashboardContainer?: DashboardContainer,
  appState?: DashboardAppStateContainer
) => {
  const [isEmbeddableRendered, setIsEmbeddableRendered] = useState(false);
  // We only mark dirty when there is changes in the panels, query, and filters
  // We do not mark dirty for embed mode, view mode, full screen and etc
  // The specific behaviors need to check the functional tests and previous dashboard
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentAppState, setCurrentAppState] = useState<DashboardAppState>();
  const dashboardDom = document.getElementById('dashboardViewport');

  const {
    timefilter: { timefilter },
  } = services.data.query;

  useEffect(() => {
    if (appState && dashboardInstance && dashboardContainer && dashboard) {
      const initialState = appState.getState();
      setCurrentAppState(initialState);

      const refreshDashboardContainer = () => {
        if (dashboardContainer.getChangesFromAppStateForContainerState) {
          const changes = dashboardContainer.getChangesFromAppStateForContainerState(
            dashboardContainer
          );
          if (changes) {
            dashboardContainer.updateInput(changes);

            if (changes.filters || changes.query || changes.timeRange || changes.refreshConfig) {
              dashboard.isDirty = true;
            }
          }
        }
      };

      const unsubscribeStateUpdates = appState.subscribe((state) => {
        // If app state is changes, then set unsaved changes to true
        // the only thing app state is not tracking is the time filter, need to check the previous dashboard if they count time filter change or not
        setCurrentAppState(state);
        refreshDashboardContainer();
      });

      // Need to add subscription for time filter specifically because app state is not tracking time filters
      // since they are part of the global state, not app state
      // However, we still need to update the dashboard container with the correct time filters because dashboard
      // container embeddable needs them to correctly pass them down and update its child visualization embeddables
      const timeFilterChange$ = merge(
        timefilter.getRefreshIntervalUpdate$(),
        timefilter.getTimeUpdate$()
      );
      timeFilterChange$.subscribe(() => {
        refreshDashboardContainer();
      });

      return () => {
        unsubscribeStateUpdates();
      };
    }
  }, [
    appState,
    eventEmitter,
    dashboardInstance,
    services,
    dashboardContainer,
    isEmbeddableRendered,
    timefilter,
    dashboard,
  ]);

  useEffect(() => {
    if (!dashboardDom || !dashboardContainer) {
      return;
    }
    dashboardContainer.render(dashboardDom);
    setIsEmbeddableRendered(true);

    return () => {
      setIsEmbeddableRendered(false);
    };
  }, [dashboardContainer, dashboardDom]);

  return { isEmbeddableRendered, currentAppState };
};
