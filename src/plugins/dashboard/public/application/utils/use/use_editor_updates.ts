/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
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
    filterManager,
    queryString,
    state$,
  } = services.data.query;

  useEffect(() => {
    if (appState && dashboardInstance && dashboardContainer) {
      const initialState = appState.getState();
      setCurrentAppState(initialState);

      const unsubscribeStateUpdates = appState.subscribe((state) => {
        setCurrentAppState(state);
        if (dashboardContainer.getChangesFromAppStateForContainerState) {
          const changes = dashboardContainer.getChangesFromAppStateForContainerState(
            dashboardContainer
          );
          if (changes) {
            dashboardContainer.updateInput(changes);
          }
        }
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
