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
  const [currentAppState, setCurrentAppState] = useState<DashboardAppState>();
  // We only mark dirty when there is changes in the panels, query, and filters
  // We do not mark dirty for embed mode, view mode, full screen and etc
  // The specific behaviors need to check the functional tests and previous dashboard
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!appState || !dashboardInstance || !dashboard) {
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
  }, [appState, eventEmitter, dashboard, dashboardInstance]);

  return { currentAppState };
};
