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

/**
 * This effect is responsible for instantiating a saved dashboard or creating a new one
 * using url parameters, embedding and destroying it in DOM
 */
export const useSavedDashboardInstance = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  isChromeVisible: boolean | undefined,
  dashboardIdFromUrl: string | undefined
) => {
  const [savedDashboardInstance, setSavedDashboardInstance] = useState<{
    savedDashboard?: SavedObjectDashboard;
    dashboard?: Dashboard<DashboardParams>;
  }>({});
  const dashboardId = useRef('');

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      history,
      http: { basePath },
      notifications,
      toastNotifications,
    } = services;

    const getSavedDashboardInstance = async () => {
      try {
        let savedDashboardInstance: any;
        if (history.location.pathname === '/create') {
          try {
            savedDashboardInstance = await getDashboardInstance(services);
          } catch {
            redirectWhenMissing({
              history,
              basePath,
              navigateToApp,
              mapping: {
                dashboard: DashboardConstants.LANDING_PAGE_PATH,
              },
              toastNotifications: notifications.toasts,
            });
          }
        } else if (dashboardIdFromUrl) {
          try {
            savedDashboardInstance = await getDashboardInstance(
              services,
              dashboardIdFromUrl
            );
            const { savedDashboard } = savedDashboardInstance;
            // Update time filter to match the saved dashboard if time restore has been set to true when saving the dashboard
            // We should only set the time filter according to time restore once when we are loading the dashboard
            if (savedDashboard.timeRestore) {
              if (savedDashboard.timeFrom && savedDashboard.timeTo) {
                services.data.query.timefilter.timefilter.setTime({
                  from: savedDashboard.timeFrom,
                  to: savedDashboard.timeTo,
                });
              }
              if (savedDashboard.refreshInterval) {
                services.data.query.timefilter.timefilter.setRefreshInterval(
                  savedDashboard.refreshInterval
                );
              }
            }

            chrome.recentlyAccessed.add(
              savedDashboard.getFullPath(),
              savedDashboard.title,
              dashboardIdFromUrl
            );
          } catch (error) {
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
              return new Promise(() => {});
            } else {
              // E.g. a corrupt or deleted dashboard
              notifications.toasts.addDanger(error.message);
              history.push(DashboardConstants.LANDING_PAGE_PATH);
              return new Promise(() => {});
            }
          }
        }

        setSavedDashboardInstance(savedDashboardInstance);
      } catch (error) {
        toastNotifications.addWarning({
          title: i18n.translate('dashboard.createDashboard.failedToLoadErrorMessage', {
            defaultMessage: 'Failed to load the dashboard',
          }),
        });
        history.replace(DashboardConstants.LANDING_PAGE_PATH);
      }
    };

    if (isChromeVisible === undefined) {
      // waiting for specifying chrome
      return;
    }

    if (!dashboardId.current) {
      dashboardId.current = dashboardIdFromUrl || 'new';
      getSavedDashboardInstance();
    } else if (
      dashboardIdFromUrl &&
      dashboardId.current !== dashboardIdFromUrl &&
      savedDashboardInstance?.savedDashboard?.id !== dashboardIdFromUrl
    ) {
      dashboardId.current = dashboardIdFromUrl;
      setSavedDashboardInstance({});
      getSavedDashboardInstance();
    }
  }, [eventEmitter, isChromeVisible, services, savedDashboardInstance, dashboardIdFromUrl]);

  return savedDashboardInstance;
};
