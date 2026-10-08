/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EventEmitter } from 'events';
import { useEffect, useRef, useState } from 'react';
import {
  redirectWhenMissing,
  SavedObjectNotFound,
} from '../../../../../opensearch_dashboards_utils/public';
import { DashboardConstants } from '../../../dashboard_constants';
import { DashboardServices } from '../../../types';
import { getDashboardInstance } from '../get_dashboard_instance';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { Dashboard, DashboardParams } from '../../../dashboard';

const CREATE_DASHBOARD_LOAD_KEY = 'create';

/**
 * This effect is responsible for instantiating a saved dashboard or creating a new one
 * using url parameters, embedding and destroying it in DOM
 */
export const useSavedDashboardInstance = ({
  services,
  eventEmitter,
  isChromeVisible,
  dashboardIdFromUrl,
}: {
  services: DashboardServices;
  eventEmitter: EventEmitter;
  isChromeVisible: boolean | undefined;
  dashboardIdFromUrl: string | undefined;
}) => {
  const [savedDashboardInstance, setSavedDashboardInstance] = useState<{
    savedDashboard?: SavedObjectDashboard;
    dashboard?: Dashboard<DashboardParams>;
  }>({});

  const currentDashboardRouteKey = useRef<string>();
  const latestRequestId = useRef(0);

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      history,
      http: { basePath },
      notifications,
      toastNotifications,
      data,
    } = services;

    // Previously, this race-condition guard only handled /view/:b -> /view/:a.
    // It did not cover route changes from /view/:id to /create.
    // Use routeKey to track the current route and trigger a reload when it changes.
    const isCreateRoute = history.location.pathname === DashboardConstants.CREATE_NEW_DASHBOARD_URL;
    const routeKey = isCreateRoute
      ? CREATE_DASHBOARD_LOAD_KEY
      : dashboardIdFromUrl
        ? `view:${dashboardIdFromUrl}`
        : undefined;

    const handleErrorFromSavedDashboard = (error: any) => {
      // Preserve BWC of v5.3.0 links for new, unsaved dashboards.
      // See https://github.com/elastic/kibana/issues/10951 for more context.
      if (error instanceof SavedObjectNotFound && dashboardIdFromUrl === 'create') {
        // Note preserve querystring part is necessary so the state is preserved through the redirect.
        history.replace({
          ...history.location, // preserve query,
          pathname: DashboardConstants.CREATE_NEW_DASHBOARD_URL,
        });

        notifications.toasts.addWarning(
          i18n.translate('dashboard.urlWasRemovedInSixZeroWarningMessage', {
            defaultMessage:
              'The url "dashboard/create" was removed in 6.0. Please update your bookmarks.',
          })
        );
      } else {
        // E.g. a corrupt or deleted dashboard
        notifications.toasts.addDanger(error.message);
        history.replace(DashboardConstants.LANDING_PAGE_PATH);
      }
      return new Promise(() => {});
    };

    const handleErrorFromCreateDashboard = () => {
      redirectWhenMissing({
        history,
        basePath,
        navigateToApp,
        mapping: {
          dashboard: DashboardConstants.LANDING_PAGE_PATH,
        },
        toastNotifications: notifications.toasts,
      });
    };

    const handleError = () => {
      toastNotifications.addWarning({
        title: i18n.translate('dashboard.createDashboard.failedToLoadErrorMessage', {
          defaultMessage: 'Failed to load the dashboard',
        }),
      });
      history.replace(DashboardConstants.LANDING_PAGE_PATH);
    };

    // TODO: handle try/catch as expected workflows instead of catching as an error
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3365
    const loadSavedDashboardInstance = async (requestId: number) => {
      try {
        const dashboardInstance = isCreateRoute
          ? await getDashboardInstance(services)
          : await getDashboardInstance(services, dashboardIdFromUrl);

        // Prevent stale requests from overriding the current state
        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!isCreateRoute) {
          const { savedDashboard } = dashboardInstance;
          // Update time filter to match the saved dashboard if time restore has been set to true when saving the dashboard
          // We should only set the time filter according to time restore once when we are loading the dashboard
          if (savedDashboard.timeRestore) {
            if (savedDashboard.timeFrom && savedDashboard.timeTo) {
              data.query.timefilter.timefilter.setTime({
                from: savedDashboard.timeFrom,
                to: savedDashboard.timeTo,
              });
            }
            if (savedDashboard.refreshInterval) {
              data.query.timefilter.timefilter.setRefreshInterval(savedDashboard.refreshInterval);
            }
          }

          chrome.recentlyAccessed.add(
            savedDashboard.getFullPath(),
            savedDashboard.title,
            dashboardIdFromUrl!,
            { type: savedDashboard.getOpenSearchType() }
          );
        }

        setSavedDashboardInstance(dashboardInstance);
      } catch (error: any) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        if (isCreateRoute) {
          handleErrorFromCreateDashboard();
          return;
        }

        if (dashboardIdFromUrl) {
          return handleErrorFromSavedDashboard(error);
        }

        handleError();
      }
    };

    if (isChromeVisible === undefined) {
      // waiting for specifying chrome
      return;
    }

    if (!routeKey || currentDashboardRouteKey.current === routeKey) {
      return;
    }

    currentDashboardRouteKey.current = routeKey;
    setSavedDashboardInstance({});
    latestRequestId.current += 1;
    loadSavedDashboardInstance(latestRequestId.current);
  }, [eventEmitter, isChromeVisible, services, dashboardIdFromUrl]);

  return savedDashboardInstance;
};
