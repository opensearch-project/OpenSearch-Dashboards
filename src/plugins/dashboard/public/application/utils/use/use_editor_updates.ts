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
  const dom = document.getElementById('dashboardViewport');

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
        dashboardContainer.reload();
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
    currentAppState,
  ]);

  useEffect(() => {
    if (!dom || !dashboardContainer) {
      return;
    }
    dashboardContainer.render(dom);
    setIsEmbeddableRendered(true);

    return () => {
      setIsEmbeddableRendered(false);
    };
  }, [appState, dashboardInstance, currentAppState, dashboardContainer, state$, dom]);

  return { isEmbeddableRendered, currentAppState };
};
