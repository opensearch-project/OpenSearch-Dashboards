/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { merge } from 'rxjs';
import { DashboardAppState, DashboardAppStateContainer, DashboardServices } from '../../../types';
import { DashboardContainer } from '../../embeddable';

export const useEditorUpdates = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  dashboardInstance?: any,
  dashboardContainer?: DashboardContainer,
  appState?: DashboardAppStateContainer
) => {
  const [isEmbeddableRendered, setIsEmbeddableRendered] = useState(false);
  const [currentAppState, setCurrentAppState] = useState<DashboardAppState>();
  const dashboardDom = document.getElementById('dashboardViewport');

  const {
    timefilter: { timefilter },
  } = services.data.query;

  useEffect(() => {
    if (appState && dashboardInstance && dashboardContainer) {
      const initialState = appState.getState();
      setCurrentAppState(initialState);

      const refreshDashboardContainer = () => {
        if (dashboardContainer.getChangesFromAppStateForContainerState) {
          const changes = dashboardContainer.getChangesFromAppStateForContainerState(
            dashboardContainer
          );
          if (changes) {
            dashboardContainer.updateInput(changes);
          }
        }
      };

      const unsubscribeStateUpdates = appState.subscribe((state) => {
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
