/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { CONTEXT_DEFAULT_SIZE_SETTING } from '../../../../../../../../../common/legacy/discover';
import { ExploreServices } from '../../../../../../../../types';
import { AppState, getState } from './context_state';
import { IndexPattern } from '../../../../../opensearch_dashboards_services';

export interface Props {
  services: ExploreServices;
  indexPattern: IndexPattern;
}

export const useContextState = ({ services, indexPattern }: Props) => {
  const { uiSettings, history, core, filterManager } = services;

  const {
    appState: appStateContainer,
    setAppState: setAppStateContainer,
    startSync,
    stopSync,
    getFilters,
    setFilters,
    flushToUrl,
  } = useMemo(() => {
    return getState({
      defaultStepSize: uiSettings.get(CONTEXT_DEFAULT_SIZE_SETTING),
      timeFieldName: indexPattern.timeFieldName || '',
      storeInSessionStorage: uiSettings.get('state:storeInSessionStorage'),
      history: history(),
      toasts: core.notifications.toasts,
    });
  }, [uiSettings, history, core.notifications.toasts, indexPattern.timeFieldName]);

  // @ts-expect-error This error existed in Discover plugin
  const [contextAppState, setContextState] = useState<AppState>(appStateContainer.getState());

  useEffect(() => {
    filterManager.setFilters(cloneDeep(getFilters()));

    startSync();

    // @ts-expect-error This error existed in Discover plugin
    const unsubscribeFromAppStateChanges = appStateContainer.subscribe((newState) => {
      setContextState((currentState) => ({ ...currentState, ...newState }));
    });

    const filterObservable = filterManager.getUpdates$().subscribe(() => {
      setFilters(filterManager);
    });

    return () => {
      stopSync();
      unsubscribeFromAppStateChanges();
      filterObservable.unsubscribe();
    };
  }, [filterManager, getFilters, setFilters, startSync, stopSync, appStateContainer]);

  const setContextAppState = (newValues: Partial<AppState>) => {
    for (const [key, value] of Object.entries(newValues)) {
      setAppStateContainer({ [key]: value });
      flushToUrl(true);
    }
  };

  return { contextAppState, setContextAppState };
};
