/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { cloneDeep, isEqual } from 'lodash';
import { connectToQueryState, opensearchFilters } from '../../../../../data/public';
import { map } from 'rxjs/operators';
import { migrateLegacyQuery } from '../../lib/migrate_legacy_query';
import { DashboardServices } from '../../../types';
import { dashboardStateToEditorState } from '../utils';
import { createDashboardAppState } from '../create_dashboard_app_state';
import { DashboardAppStateContainer } from '../../../types';
import { migrateAppState, getAppStateDefaults } from '../../lib';

/**
 * This effect is responsible for instantiating the dashboard app state container,
 * which is in sync with "_a" url param
 */
export const useDashboardAppState = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  instance: any
) => {
  const [appState, setAppState] = useState<DashboardAppStateContainer | null>(null);

  useEffect(() => {
    const { dashboardConfig, usageCollection, opensearchDashboardsVersion } = services;
    const hideWriteControls = dashboardConfig.getHideWriteControls();
    const stateDefaults = migrateAppState(
      getAppStateDefaults(instance, hideWriteControls),
      opensearchDashboardsVersion,
      usageCollection
    );

    // missing panels, fullScreenMode, title, description, and 3 more.ts(2740)
    const { stateContainer, stopStateSync } = createDashboardAppState({
      stateDefaults,
      osdUrlStateStorage: services.osdUrlStateStorage,
      services,
      instance,
    });

    /*const onDirtyStateChange = ({ isDirty }: { isDirty: boolean }) => {
      if (!isDirty) {
        stateContainer.transitions.updateDashboardState(
          dashboardStateToEditorState(instance, services)
        );
      }
    };

    eventEmitter.on('dirtyStateChange', onDirtyStateChange);*/

    const { filterManager, queryString } = services.data.query;

    // sync initial app state from state container to managers
    filterManager.setAppFilters(cloneDeep(stateContainer.getState().filters));
    queryString.setQuery(migrateLegacyQuery(stateContainer.getState().query));

    
    // setup syncing of app filters between app state and query services
    const stopSyncingAppFilters = connectToQueryState(
      services.data.query,
      {
        set: ({ filters, query }) => {
          stateContainer.transitions.set('filters', filters || []);
          stateContainer.transitions.set('query', query || queryString.getDefaultQuery());
        },
        get: () => ({
          filters: stateContainer.getState().filters,
          query: migrateLegacyQuery(stateContainer.getState().query),
        }),
        state$: stateContainer.state$.pipe(
          map((state) => ({
            filters: state.filters,
            query: queryString.formatQuery(state.query)
          }))
        ),
      },
      {
        filters: opensearchFilters.FilterStateStore.APP_STATE,
        query: true,
      }
    );

   /*     // The hash check is so we only update the time filter on dashboard open, not during
    // normal cross app navigation.
    if (dashboardStateManager.getIsTimeSavedWithDashboard()) {
        const initialGlobalStateInUrl = osdUrlStateStorage.get<QueryState>('_g');
        if (!initialGlobalStateInUrl?.time) {
          dashboardStateManager.syncTimefilterWithDashboardTime(timefilter);
        }
        if (!initialGlobalStateInUrl?.refreshInterval) {
          dashboardStateManager.syncTimefilterWithDashboardRefreshInterval(timefilter);
        }
    }*/

    /*if (!isEqual(stateContainer.getState(), stateDefaults)) {
        const { aggs, ...visState } = stateContainer.getState().vis;
        instance.vis
          .setState({ ...visState, data: { aggs } })
          .then(() => {
            // setting up the stateContainer after setState is successful will prevent loading the editor with failures
            // otherwise the catch will take presedence
            setAppState(stateContainer);
          })
          .catch((error: Error) => {
            // if setting new vis state was failed for any reason,
            // redirect to the listing page with error message
            services.toastNotifications.addWarning({
              title: i18n.translate('visualize.visualizationLoadingFailedErrorMessage', {
                defaultMessage: 'Failed to load the visualization',
              }),
              text: toMountPoint(<MarkdownSimple>{error.message}</MarkdownSimple>),
            });

            services.history.replace(
              `${VisualizeConstants.LANDING_PAGE_PATH}?notFound=visualization`
            );
          });
      } else {*/
    setAppState(stateContainer);
      
    return () => {
        //eventEmitter.off('dirtyStateChange', onDirtyStateChange)
        stopStateSync();
        stopSyncingAppFilters()
      }
  }, [eventEmitter, instance, services]);

  return { appState }
}; 
