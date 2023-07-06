/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'events';
import { useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { map } from 'rxjs/operators';
import { Subscription, merge } from 'rxjs';
import { IndexPattern, connectToQueryState, opensearchFilters } from '../../../../../data/public';
import { migrateLegacyQuery } from '../../lib/migrate_legacy_query';
import { DashboardServices } from '../../../types';

import { DashboardAppStateContainer } from '../../../types';
import { migrateAppState, getAppStateDefaults } from '../../lib';
import { createDashboardGlobalAndAppState } from '../create_dashboard_app_state';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import {
  createDashboardContainer,
  handleDashboardContainerInputs,
  handleDashboardContainerOutputs,
  refreshDashboardContainer,
  renderEmpty,
} from '../create_dashboard_container';
import { DashboardContainer } from '../../embeddable';
import { Dashboard } from '../../../dashboard';

/**
 * This effect is responsible for instantiating the dashboard app and global state container,
 * which is in sync with "_a" and "_g" url param
 */
export const useDashboardAppAndGlobalState = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  instance?: SavedObjectDashboard,
  dashboard?: Dashboard
) => {
  const [appStateContainer, setAppStateContainer] = useState<
    DashboardAppStateContainer | undefined
  >();
  const [currentContainer, setCurrentContainer] = useState<DashboardContainer | undefined>();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>([]);

  useEffect(() => {
    if (instance && dashboard) {
      let unsubscribeFromDashboardContainer: () => void;

      const { dashboardConfig, usageCollection, opensearchDashboardsVersion } = services;
      const hideWriteControls = dashboardConfig.getHideWriteControls();
      const stateDefaults = migrateAppState(
        getAppStateDefaults(instance, hideWriteControls),
        opensearchDashboardsVersion,
        usageCollection
      );

      const {
        stateContainer,
        stopStateSync,
        stopSyncingQueryServiceStateWithUrl,
      } = createDashboardGlobalAndAppState({
        stateDefaults,
        osdUrlStateStorage: services.osdUrlStateStorage,
        services,
        instance,
      });

      const {
        filterManager,
        queryString,
        timefilter: { timefilter },
      } = services.data.query;

      // sync initial app state from state container to managers
      filterManager.setAppFilters(cloneDeep(stateContainer.getState().filters));
      queryString.setQuery(migrateLegacyQuery(stateContainer.getState().query));

      // setup syncing of app filters between app state and query services
      const stopSyncingAppFilters = connectToQueryState(
        services.data.query,
        {
          set: ({ filters, query }) => {
            stateContainer.transitions.setDashboard({
              filters: filters || [],
              query: query || queryString.getDefaultQuery(),
            });
          },
          get: () => ({
            filters: stateContainer.getState().filters,
            query: migrateLegacyQuery(stateContainer.getState().query),
          }),
          state$: stateContainer.state$.pipe(
            map((state) => ({
              filters: state.filters,
              query: queryString.formatQuery(state.query),
            }))
          ),
        },
        {
          filters: opensearchFilters.FilterStateStore.APP_STATE,
          query: true,
        }
      );

      const getDashboardContainer = async () => {
        const subscriptions = new Subscription();
        const dashboardContainer = await createDashboardContainer(
          services,
          instance,
          stateContainer
        );
        setCurrentContainer(dashboardContainer);

        if (!dashboardContainer) {
          return;
        }

        dashboardContainer.renderEmpty = () =>
          renderEmpty(dashboardContainer, stateContainer.getState(), services);

        const stopSyncingDashboardContainerOutputs = handleDashboardContainerOutputs(
          services,
          dashboardContainer,
          setIndexPatterns
        );

        const stopSyncingDashboardContainerInputs = handleDashboardContainerInputs(
          services,
          dashboardContainer,
          stateContainer,
          dashboard
        );

        // If app state is changes, then set unsaved changes to true
        // the only thing app state is not tracking is the time filter, need to check the previous dashboard if they count time filter change or not
        const stopSyncingFromAppState = stateContainer.subscribe((state) => {
          refreshDashboardContainer(dashboardContainer, services, dashboard, state);
        });

        subscriptions.add(stopSyncingFromAppState);

        // Need to add subscription for time filter specifically because app state is not tracking time filters
        // since they are part of the global state, not app state
        // However, we still need to update the dashboard container with the correct time filters because dashboard
        // container embeddable needs them to correctly pass them down and update its child visualization embeddables
        const stopSyncingFromTimeFilters = merge(
          timefilter.getRefreshIntervalUpdate$(),
          timefilter.getTimeUpdate$()
        ).subscribe(() => {
          refreshDashboardContainer(
            dashboardContainer,
            services,
            dashboard,
            stateContainer.getState()
          );
        });

        subscriptions.add(stopSyncingFromTimeFilters);

        unsubscribeFromDashboardContainer = () => {
          stopSyncingDashboardContainerInputs();
          stopSyncingDashboardContainerOutputs();
          subscriptions.unsubscribe();
        };
      };

      getDashboardContainer();
      setAppStateContainer(stateContainer);

      return () => {
        stopStateSync();
        stopSyncingAppFilters();
        stopSyncingQueryServiceStateWithUrl();
        unsubscribeFromDashboardContainer?.();
      };
    }
  }, [dashboard, eventEmitter, instance, services]);

  return { appStateContainer, currentContainer, indexPatterns };
};
